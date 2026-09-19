import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import { apiClient, endpoints } from '@/api';

/**
 * Support contacts and policy links come from the tenant's settings, not from
 * the app: a phone number or a policy URL belongs to whoever runs the store.
 * Anything the tenant has not configured arrives as null, and the screens hide
 * that action rather than offering a button that does nothing.
 */
export type SupportInfo = {
  phone: string | null;
  email: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  topics: string[];
};

export type AccountRequest = {
  type: 'delete_account' | 'data_export';
  reference: string | null;
  status: number;
  raisedAt: number;
};

const EMPTY: SupportInfo = { phone: null, email: null, termsUrl: null, privacyUrl: null, topics: [] };

type SupportApi = {
  info: SupportInfo;
  requests: AccountRequest[];
  refresh: () => Promise<void>;
  raiseTicket: (topic: string, description: string) => Promise<{ ok: true; reference: string } | { ok: false; error: string }>;
  requestDeletion: (reason: string) => Promise<{ ok: true; reference: string } | { ok: false; error: string }>;
  requestExport: () => Promise<{ ok: true; reference: string } | { ok: false; error: string }>;
  /** Opens tel:/mailto:/https: only when the tenant configured a value. */
  open: (url: string) => Promise<boolean>;
};

const SupportContext = createContext<SupportApi | null>(null);

const failed = (error: unknown) => ({ ok: false as const, error: error instanceof Error ? error.message : 'That did not go through.' });

export function SupportProvider({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  const [info, setInfo] = useState<SupportInfo>(EMPTY);
  const [requests, setRequests] = useState<AccountRequest[]>([]);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      return;
    }
    try {
      const [s, r] = await Promise.all([
        apiClient.get<{ support: SupportInfo }>(endpoints.auth.support),
        apiClient.get<{ requests: AccountRequest[] }>(endpoints.auth.accountRequests),
      ]);
      setInfo(s.support ?? EMPTY);
      setRequests(r.requests ?? []);
    } catch {
      // Support details are not worth interrupting anyone for; the screens
      // simply show nothing until the next attempt.
    }
  }, [signedIn]);

  useEffect(() => {
    if (signedIn) {
      refresh();
    } else {
      setInfo(EMPTY);
      setRequests([]);
    }
  }, [signedIn, refresh]);

  const value = useMemo<SupportApi>(
    () => ({
      info,
      requests,
      refresh,
      raiseTicket: async (topic, description) => {
        try {
          const res = await apiClient.post<{ reference: string }>(endpoints.auth.raiseTicket, { topic, description });
          await refresh();
          return { ok: true, reference: res.reference };
        } catch (error) {
          return failed(error);
        }
      },
      requestDeletion: async reason => {
        try {
          const res = await apiClient.post<{ reference: string }>(endpoints.auth.requestDeletion, { reason });
          await refresh();
          return { ok: true, reference: res.reference };
        } catch (error) {
          return failed(error);
        }
      },
      requestExport: async () => {
        try {
          const res = await apiClient.post<{ reference: string }>(endpoints.auth.requestExport, {});
          await refresh();
          return { ok: true, reference: res.reference };
        } catch (error) {
          return failed(error);
        }
      },
      open: async (url: string) => {
        try {
          await Linking.openURL(url);
          return true;
        } catch {
          return false;
        }
      },
    }),
    [info, requests, refresh],
  );

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}

export function useSupport() {
  const value = useContext(SupportContext);
  if (!value) {
    throw new Error('useSupport must be used inside SupportProvider');
  }
  return value;
}
