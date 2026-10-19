import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, apiClient, endpoints } from '@/api';
import { useToast } from '@/components';
import { POLL_INTERVAL_MS, USE_MOCK_DATA } from '@config/constants';
import type { FranchisePartnerDetail, FranchiseState, FranchiseVendorDetail, FranchiseVendorReport } from '@/domain/types';
import type { Branding } from '@/theme';

import { DEMO_FRANCHISE, demoPartnerDetail, demoVendorDetail } from './demo/franchise';
import { useSession } from './session';

const LIVE = !USE_MOCK_DATA;

/** What the screens show before the first poll lands. */
const EMPTY: FranchiseState = {
  profile: { name: '', owner: '', initials: '', code: '', mobile: '', email: '', territory: '', area: '', commissionPct: 0, bank: '' },
  today: { orders: 0, sales: 0, earned: 0, liveOrders: 0, vendorsOnline: 0, partnersOnline: 0 },
  month: { orders: 0, sales: 0, earned: 0, cancelled: 0 },
  days: [],
  weeks: [],
  vendors: [],
  partners: [],
};

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export type ActionResult = { ok: true } | { ok: false; error: string };

function useFranchiseValue() {
  const { session, signOut, setBranding } = useSession();
  const toast = useToast();
  const [state, setState] = useState<FranchiseState>(LIVE ? EMPTY : DEMO_FRANCHISE);
  const [loaded, setLoaded] = useState(!LIVE);
  const active = LIVE && session?.activeRole === 'franchise';
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!active || busy.current) {
      return;
    }
    busy.current = true;
    try {
      const res = await apiClient.get<{ data: FranchiseState & { branding?: Branding | null } }>(endpoints.franchise.state);
      const { branding, ...next } = res.data;
      setState(next);
      setLoaded(true);
      setBranding(branding ?? null);
    } catch (error) {
      // An expired or rejected token means the session is over.
      if (error instanceof ApiError && error.status === 401) {
        signOut();
      } else if (error instanceof Error) {
        toast(error.message);
      }
    } finally {
      busy.current = false;
    }
  }, [active, toast, signOut, setBranding]);

  useEffect(() => {
    if (!active) {
      return;
    }
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, refresh]);

  // A different account must not see the previous one's numbers while its own load.
  useEffect(() => {
    if (LIVE && !session) {
      setState(EMPTY);
      setLoaded(false);
    }
  }, [session]);

  const setBlocked = useCallback(
    async (kind: 'vendors' | 'partners', id: string, blocked: boolean): Promise<ActionResult> => {
      if (!LIVE) {
        setState(s => ({ ...s, [kind]: s[kind].map(row => (row.id === id ? { ...row, blocked, online: blocked ? false : row.online } : row)) }));
        return { ok: true };
      }
      try {
        await apiClient.post(kind === 'vendors' ? endpoints.franchise.setVendorBlocked : endpoints.franchise.setPartnerBlocked, {
          id: Number(id),
          blocked,
        });
        refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the server.' };
      }
    },
    [refresh],
  );

  /** Benefit and loss between two days (both inclusive), for one vendor or all. Demo mode uses the 30-day figures. */
  const vendorReport = useCallback(
    async (from: Date, to: Date, vendorId?: string): Promise<{ ok: true; report: FranchiseVendorReport } | { ok: false; error: string }> => {
      if (!LIVE) {
        const vendors = state.vendors.filter(v => !vendorId || v.id === vendorId).map(v => ({
          id: v.id,
          name: v.name,
          orders: v.orders30d,
          sales: v.sales30d,
          earned: v.earned30d,
          cancelled: v.cancelled30d,
          lostSales: v.lostSales30d,
        }));
        const total = vendors.reduce(
          (t, v) => ({ orders: t.orders + v.orders, sales: t.sales + v.sales, earned: t.earned + v.earned, cancelled: t.cancelled + v.cancelled, lostSales: t.lostSales + v.lostSales }),
          { orders: 0, sales: 0, earned: 0, cancelled: 0, lostSales: 0 },
        );
        return { ok: true, report: { vendors, total } };
      }
      try {
        const res = await apiClient.get<{ data: FranchiseVendorReport }>(`${endpoints.franchise.vendorReport}?from=${isoDay(from)}&to=${isoDay(to)}${vendorId ? `&vendor_id=${vendorId}` : ''}`);
        return { ok: true, report: res.data };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the server.' };
      }
    },
    [state.vendors],
  );

  /** The full record for one vendor of this franchise. Demo mode fills what the list already knows. */
  const vendorDetail = useCallback(
    async (id: string): Promise<{ ok: true; detail: FranchiseVendorDetail } | { ok: false; error: string }> => {
      if (!LIVE) {
        const v = state.vendors.find(x => x.id === id);
        return v ? { ok: true, detail: demoVendorDetail(v) } : { ok: false, error: 'Vendor not found.' };
      }
      try {
        const res = await apiClient.get<{ data: FranchiseVendorDetail }>(`${endpoints.franchise.vendor}?id=${id}`);
        return { ok: true, detail: res.data };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the server.' };
      }
    },
    [state.vendors],
  );

  const partnerDetail = useCallback(
    async (id: string): Promise<{ ok: true; detail: FranchisePartnerDetail } | { ok: false; error: string }> => {
      if (!LIVE) {
        const p = state.partners.find(x => x.id === id);
        return p ? { ok: true, detail: demoPartnerDetail(p) } : { ok: false, error: 'Partner not found.' };
      }
      try {
        const res = await apiClient.get<{ data: FranchisePartnerDetail }>(`${endpoints.franchise.partner}?id=${id}`);
        return { ok: true, detail: res.data };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the server.' };
      }
    },
    [state.partners],
  );

  return useMemo(
    () => ({
      state,
      loaded,
      refresh,
      vendorReport,
      vendorDetail,
      partnerDetail,
      actions: {
        setVendorBlocked: (id: string, blocked: boolean) => setBlocked('vendors', id, blocked),
        setPartnerBlocked: (id: string, blocked: boolean) => setBlocked('partners', id, blocked),
      },
    }),
    [state, loaded, refresh, vendorReport, vendorDetail, partnerDetail, setBlocked],
  );
}

type FranchiseApi = ReturnType<typeof useFranchiseValue>;

const FranchiseContext = createContext<FranchiseApi | null>(null);

export function FranchiseStoreProvider({ children }: { children: React.ReactNode }) {
  const value = useFranchiseValue();
  return <FranchiseContext.Provider value={value}>{children}</FranchiseContext.Provider>;
}

export const useFranchise = () => {
  const ctx = useContext(FranchiseContext);
  if (!ctx) {
    throw new Error('useFranchise must be used inside FranchiseStoreProvider');
  }
  return ctx;
};
