import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiClient, endpoints } from '@/api';
import { storage } from '@/api/storage';
import { USE_MOCK_DATA } from '@config/constants';
import type { Account, Role } from '@/domain/types';
import type { Branding } from '@/theme';

import { findAccount } from './demo/accounts';

export type Session = {
  account: Account;
  activeRole: Role;
};

export type SignInResult = { ok: true } | { ok: false; error: string };

type LoginResponse = { token: string; role: Role; account: Account; branding?: Branding | null };
type AccountResponse = { role: Role; account: Account; branding?: Branding | null };
type BrandingResponse = { branding?: Branding | null };

type SessionApi = {
  session: Session | null;
  /** True while a stored token is being checked at startup. */
  restoring: boolean;
  /** Colours the tenant picked in the admin dashboard; null keeps the built-in palette. */
  branding: Branding | null;
  /** The workspace stores pass on the branding that rides along with their polls. */
  setBranding: (next: Branding | null) => void;
  /** The workspace is picked on the sign-in screen; the account must hold that role. */
  signInWithPassword: (mobile: string, password: string, role: Role) => Promise<SignInResult>;
  /** Sends the OTP for sign-in or for a password reset. */
  requestOtp: (mobile: string, role: Role | undefined, purpose: 'login' | 'reset') => Promise<SignInResult>;
  verifyOtp: (mobile: string, code: string, role: Role) => Promise<SignInResult>;
  resetPassword: (mobile: string, otp: string, password: string) => Promise<SignInResult>;
  /** Dual-role accounts can move between workspaces from Profile. */
  switchRole: () => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<SessionApi | null>(null);

const ROLE_NAME: Record<Role, string> = { vendor: 'a vendor', delivery: 'a delivery partner' };

const failed = (error: unknown): SignInResult => ({
  ok: false,
  error: error instanceof Error ? error.message : 'Something went wrong. Try again.',
});

/** Demo mode only: looks up the seeded account and confirms it holds the role. */
const resolveDemo = (mobile: string, role: Role): { account: Account } | { error: string } => {
  const account = findAccount(mobile);
  if (!account) {
    return { error: "This number isn't registered. Contact your store admin." };
  }
  if (!account.roles.includes(role)) {
    return { error: `This number isn't registered as ${ROLE_NAME[role]}. Choose the other workspace.` };
  }
  return { account };
};

const BRANDING_KEY = 'partner.branding';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(!USE_MOCK_DATA);
  const [branding, setBrandingState] = useState<Branding | null>(null);

  /** Keeps the last colours on the device, so the app opens already themed. */
  const setBranding = useCallback((next: Branding | null) => {
    setBrandingState(next ?? null);
    if (next) {
      storage.set(BRANDING_KEY, JSON.stringify(next));
    } else {
      storage.remove(BRANDING_KEY);
    }
  }, []);

  // A token from a previous run keeps the partner signed in.
  useEffect(() => {
    if (USE_MOCK_DATA) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cached = await storage.get(BRANDING_KEY);
        if (cached && !cancelled) {
          try {
            setBrandingState(JSON.parse(cached) as Branding);
          } catch {
            await storage.remove(BRANDING_KEY);
          }
        }
        const token = await apiClient.restoreClient();
        if (token) {
          const me = await apiClient.get<AccountResponse>(endpoints.auth.account);
          if (!cancelled) {
            setSession({ account: me.account, activeRole: me.role });
            setBranding(me.branding ?? null);
          }
        } else {
          // Nobody is signed in yet: the sign-in screen still gets the tenant's colours.
          const published = await apiClient.get<BrandingResponse>(endpoints.auth.branding);
          if (!cancelled) {
            setBranding(published.branding ?? null);
          }
        }
      } catch {
        await apiClient.setAuthToken(null);
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setBranding]);

  const signInWithPassword = useCallback(async (mobile: string, password: string, role: Role): Promise<SignInResult> => {
    if (USE_MOCK_DATA) {
      const found = resolveDemo(mobile, role);
      if ('error' in found) {
        return { ok: false, error: found.error };
      }
      if (password.trim().length < 4) {
        return { ok: false, error: 'Incorrect password. Try again or use OTP.' };
      }
      setSession({ account: found.account, activeRole: role });
      return { ok: true };
    }
    try {
      const res = await apiClient.post<LoginResponse>(endpoints.auth.login, { mobile, password, role });
      await apiClient.setAuthToken(res.token);
      setSession({ account: res.account, activeRole: res.role });
      setBranding(res.branding ?? null);
      return { ok: true };
    } catch (error) {
      return failed(error);
    }
  }, [setBranding]);

  const requestOtp = useCallback(async (mobile: string, role: Role | undefined, purpose: 'login' | 'reset'): Promise<SignInResult> => {
    if (USE_MOCK_DATA) {
      if (purpose === 'reset') {
        return findAccount(mobile) ? { ok: true } : { ok: false, error: "This number isn't registered. Contact your store admin." };
      }
      const found = resolveDemo(mobile, role ?? 'vendor');
      return 'error' in found ? { ok: false, error: found.error } : { ok: true };
    }
    try {
      await apiClient.post(endpoints.auth.sendOtp, {
        mobile,
        role,
        purpose: purpose === 'reset' ? 'password_reset' : 'login',
      });
      return { ok: true };
    } catch (error) {
      return failed(error);
    }
  }, []);

  const verifyOtp = useCallback(async (mobile: string, code: string, role: Role): Promise<SignInResult> => {
    if (USE_MOCK_DATA) {
      const found = resolveDemo(mobile, role);
      if ('error' in found) {
        return { ok: false, error: found.error };
      }
      if (!/^\d{6}$/.test(code)) {
        return { ok: false, error: 'Enter the 6-digit code.' };
      }
      setSession({ account: found.account, activeRole: role });
      return { ok: true };
    }
    try {
      const res = await apiClient.post<LoginResponse>(endpoints.auth.verifyOtp, { mobile, otp: code, role });
      await apiClient.setAuthToken(res.token);
      setSession({ account: res.account, activeRole: res.role });
      setBranding(res.branding ?? null);
      return { ok: true };
    } catch (error) {
      return failed(error);
    }
  }, [setBranding]);

  const resetPassword = useCallback(async (mobile: string, otp: string, password: string): Promise<SignInResult> => {
    if (USE_MOCK_DATA) {
      return { ok: true };
    }
    try {
      await apiClient.post(endpoints.auth.resetPassword, { mobile, otp, password });
      return { ok: true };
    } catch (error) {
      return failed(error);
    }
  }, []);

  const switchRole = useCallback(async () => {
    if (!session || session.account.roles.length < 2) {
      return;
    }
    const next: Role = session.activeRole === 'vendor' ? 'delivery' : 'vendor';
    if (USE_MOCK_DATA) {
      setSession({ ...session, activeRole: next });
      return;
    }
    try {
      const res = await apiClient.post<LoginResponse>(endpoints.auth.switchRole, { role: next });
      await apiClient.setAuthToken(res.token);
      setSession({ account: res.account, activeRole: res.role });
      setBranding(res.branding ?? null);
    } catch {
      // Staying in the current workspace is the safe outcome.
    }
  }, [session, setBranding]);

  const signOut = useCallback(() => {
    setSession(null);
    if (!USE_MOCK_DATA) {
      apiClient.setAuthToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({ session, restoring, branding, setBranding, signInWithPassword, requestOtp, verifyOtp, resetPassword, switchRole, signOut }),
    [session, restoring, branding, setBranding, signInWithPassword, requestOtp, verifyOtp, resetPassword, switchRole, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
};
