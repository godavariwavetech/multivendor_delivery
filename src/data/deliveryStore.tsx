import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { ApiError, apiClient, endpoints } from '@/api';
import { useToast } from '@/components';
import { POLL_INTERVAL_MS, USE_MOCK_DATA } from '@config/constants';
import type { ActiveTrip, AppNotification, DeliveryRequest, Trip } from '@/domain/types';
import type { Branding } from '@/theme';

import { PARTNER_PROFILE } from './demo/accounts';
import { ACTIVE_SEED, seedRequests } from './demo/requests';
import { STATEMENTS, TODAY_BASE, WEEK_BASE, partnerNotifications, seedTrips } from './demo/trips';
import { useSession } from './session';

const MIN = 60_000;
const LIVE = !USE_MOCK_DATA;

export type PartnerProfile = typeof PARTNER_PROFILE;
export type TodayStats = { deliveries: number; km: number; earned: number; peakDone: number; peakTarget: number; peakReward: number };
export type WeekSummary = typeof WEEK_BASE;
export type Statement = (typeof STATEMENTS)[number];

/** The slices that come from GET /getpartnerstate. */
type ServerState = {
  profile: PartnerProfile;
  online: boolean;
  onlineSince: number;
  requests: DeliveryRequest[];
  active: ActiveTrip | null;
  activeRequest: DeliveryRequest | null;
  trips: Trip[];
  today: TodayStats;
  week: WeekSummary;
  statements: Statement[];
  prefs: { zone: string; shift: string; requestAlerts: boolean };
  /** The zones the tenant serves, and the shift/sound/language choices. */
  zones: { key: string; detail: string }[];
  options: { shifts: string[] };
  notifications: AppNotification[];
};

type State = {
  profile: PartnerProfile;
  online: boolean;
  onlineSince: number;
  requests: DeliveryRequest[];
  /** Requests the partner has accepted, including the one in progress. */
  accepted: Record<string, DeliveryRequest>;
  active?: ActiveTrip;
  trips: Trip[];
  today: TodayStats;
  week: WeekSummary;
  statements: Statement[];
  prefs: { requestAlerts: boolean; zone: string; shift: string };
  zones: { key: string; detail: string }[];
  options: { shifts: string[] };
  notifications: AppNotification[];
  loaded: boolean;
};

type Action =
  | { type: 'hydrate'; data: ServerState }
  | { type: 'setOnline'; on: boolean }
  | { type: 'skip'; id: string }
  | { type: 'accept'; id: string }
  | { type: 'reachStore' }
  | { type: 'toggleCheck'; key: string }
  | { type: 'confirmPickup' }
  | { type: 'arrived' }
  | { type: 'proofPhoto' }
  | { type: 'complete' }
  | { type: 'rateHandover'; rating: 'slow' | 'fine' | 'quick' }
  | { type: 'finish' }
  | { type: 'fail'; reason: string }
  | { type: 'refreshRequests' }
  | { type: 'setPref'; key: keyof State['prefs']; value: string | boolean }
  | { type: 'readNotifications' };

const DEMO_ZONES = [
  { key: 'Zone 4', detail: 'Chennai North · Anna Nagar, Kilpauk, Thiru Vi Ka Nagar' },
  { key: 'Zone 3', detail: 'Chennai Central · Egmore, Nungambakkam, Chetpet' },
  { key: 'Zone 5', detail: 'Chennai West · Koyambedu, Arumbakkam, Vadapalani' },
];

const DEMO_OPTIONS = { shifts: ['mornings', 'afternoons', 'evenings', 'nights'] };

const demoInitial = (): State => {
  const now = Date.now();
  return {
    profile: PARTNER_PROFILE,
    online: true,
    onlineSince: now - 3.5 * 60 * MIN,
    requests: seedRequests(),
    accepted: { [ACTIVE_SEED.id]: ACTIVE_SEED },
    active: {
      requestId: ACTIVE_SEED.id,
      stage: 'on_the_way',
      acceptedAt: now - 14 * MIN,
      arrivedStoreAt: now - 8 * MIN,
      pickedUpAt: now - 4 * MIN,
      checks: { parcels: true, upright: true, gravy: true },
      proofPhoto: false,
    },
    trips: seedTrips(now),
    today: { ...TODAY_BASE },
    week: { ...WEEK_BASE },
    statements: STATEMENTS,
    prefs: { requestAlerts: true, zone: 'Zone 4', shift: 'evenings' },
    zones: DEMO_ZONES,
    options: DEMO_OPTIONS,
    notifications: partnerNotifications(now),
    loaded: true,
  };
};

const liveInitial = (): State => ({
  profile: { ...PARTNER_PROFILE, name: '—', initials: '', id: '', mobile: '', rating: 0, trips: 0 },
  online: false,
  onlineSince: Date.now(),
  requests: [],
  accepted: {},
  active: undefined,
  trips: [],
  today: { deliveries: 0, km: 0, earned: 0, peakDone: 0, peakTarget: 5, peakReward: 120 },
  week: { ...WEEK_BASE, label: '—', trips: 0, km: 0, total: 0, base: 0, distance: 0, peak: 0, tips: 0, bars: [] },
  statements: [],
  prefs: { requestAlerts: true, zone: '', shift: 'evenings' },
  zones: [],
  options: DEMO_OPTIONS,
  notifications: [],
  loaded: false,
});

const initial = (): State => (LIVE ? liveInitial() : demoInitial());

const patchActive = (state: State, patch: Partial<ActiveTrip>): State =>
  state.active ? { ...state, active: { ...state.active, ...patch } } : state;

function reducer(state: State, action: Action): State {
  const now = Date.now();
  switch (action.type) {
    case 'hydrate': {
      const d = action.data;
      const previous = state.active;
      let active = d.active ?? undefined;
      if (previous?.stage === 'complete') {
        // The summary stays up until the partner taps Done.
        active = previous;
      } else if (active && previous && previous.requestId === active.requestId) {
        active = { ...active, checks: previous.checks, proofPhoto: active.proofPhoto || previous.proofPhoto };
      }
      const accepted = d.activeRequest ? { ...state.accepted, [d.activeRequest.id]: d.activeRequest } : state.accepted;
      return {
        ...state,
        profile: d.profile,
        online: d.online,
        onlineSince: d.onlineSince,
        requests: d.requests,
        accepted,
        active,
        trips: d.trips,
        today: d.today,
        week: d.week,
        statements: d.statements,
        prefs: {
          zone: d.prefs.zone || state.prefs.zone,
          shift: d.prefs.shift || state.prefs.shift,
          requestAlerts: d.prefs.requestAlerts,
        },
        zones: d.zones ?? state.zones,
        options: d.options ?? state.options,
        notifications: d.notifications,
        loaded: true,
      };
    }
    case 'setOnline':
      return { ...state, online: action.on, onlineSince: action.on ? now : state.onlineSince };
    case 'skip':
      return { ...state, requests: state.requests.map(r => (r.id === action.id ? { ...r, status: 'skipped' } : r)) };
    case 'accept': {
      const req = state.requests.find(r => r.id === action.id);
      if (!req || state.active) {
        return state;
      }
      return {
        ...state,
        requests: state.requests.map(r => (r.id === action.id ? { ...r, status: 'accepted' } : r)),
        accepted: { ...state.accepted, [req.id]: { ...req, status: 'accepted' } },
        active: { requestId: req.id, assignmentId: req.assignmentId, stage: 'to_store', acceptedAt: now, checks: {}, proofPhoto: false },
      };
    }
    case 'reachStore':
      return patchActive(state, { stage: 'at_store', arrivedStoreAt: now });
    case 'toggleCheck':
      return state.active
        ? patchActive(state, { checks: { ...state.active.checks, [action.key]: !state.active.checks[action.key] } })
        : state;
    case 'confirmPickup':
      return patchActive(state, { stage: 'on_the_way', pickedUpAt: now });
    case 'arrived':
      return patchActive(state, { stage: 'arrived' });
    case 'proofPhoto':
      return patchActive(state, { proofPhoto: true });
    case 'complete': {
      if (!state.active) {
        return state;
      }
      const req = state.accepted[state.active.requestId];
      const minutes = Math.max(8, Math.round((now - state.active.acceptedAt) / MIN));
      const trip: Trip = {
        id: req.id,
        store: req.store.name,
        category: req.category,
        at: now,
        km: req.totalKm,
        minutes,
        earning: req.payout,
        tip: req.breakdown.tip,
        status: 'delivered',
        customer: req.drop.name,
        verifiedBy: req.customerOtp ? `Customer OTP ${req.customerOtp}` : 'Customer OTP',
        breakdown: req.breakdown,
      };
      return {
        ...state,
        trips: [trip, ...state.trips],
        requests: state.requests.map(r => (r.id === req.id ? { ...r, status: 'done' } : r)),
        active: { ...state.active, stage: 'complete', deliveredAt: now },
      };
    }
    case 'rateHandover':
      return patchActive(state, { handoverRating: action.rating });
    case 'finish':
      return { ...state, active: undefined };
    case 'fail': {
      if (!state.active) {
        return state;
      }
      const req = state.accepted[state.active.requestId];
      const trip: Trip = {
        id: req.id,
        store: req.store.name,
        category: req.category,
        at: now,
        km: req.totalKm,
        minutes: Math.max(5, Math.round((now - state.active.acceptedAt) / MIN)),
        earning: Math.round(req.payout * 0.35),
        tip: 0,
        status: 'cancelled',
        note: action.reason.toLowerCase(),
        customer: req.drop.name,
        breakdown: { base: Math.round(req.payout * 0.35), distance: 0, tip: 0 },
      };
      return {
        ...state,
        trips: [trip, ...state.trips],
        requests: state.requests.map(r => (r.id === req.id ? { ...r, status: 'done' } : r)),
        active: undefined,
      };
    }
    case 'refreshRequests': {
      const fresh = seedRequests().map(r => ({
        ...r,
        id: `${r.id.slice(0, 3)}${Number(r.id.slice(3)) + 100 + Math.floor(Math.random() * 50)}`,
      }));
      return { ...state, requests: fresh };
    }
    case 'setPref':
      return { ...state, prefs: { ...state.prefs, [action.key]: action.value } };
    case 'readNotifications':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    default:
      return state;
  }
}

export type ActionResult = { ok: true } | { ok: false; error: string };

type DeliveryApi = ReturnType<typeof useDeliveryValue>;

const DeliveryContext = createContext<DeliveryApi | null>(null);

function useDeliveryValue() {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const { session, signOut, setBranding } = useSession();
  const toast = useToast();
  const active = LIVE && session?.activeRole === 'delivery';
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!active || busy.current) {
      return;
    }
    busy.current = true;
    try {
      const res = await apiClient.get<{ data: ServerState & { branding?: Branding | null } }>(endpoints.delivery.state);
      dispatch({ type: 'hydrate', data: res.data });
      // A colour changed in the admin dashboard reaches the app on this poll.
      setBranding(res.data.branding ?? null);
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

  /** Fire-and-refresh: the screens already moved on, the poll corrects them. */
  const send = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      if (!active) {
        return;
      }
      try {
        await apiClient.post(path, body);
      } catch (error) {
        if (error instanceof Error) {
          toast(error.message);
        }
      }
      refresh();
    },
    [active, refresh, toast],
  );

  /** For the two code screens, which need the server's answer before moving on. */
  const ask = useCallback(
    async (path: string, body: Record<string, unknown>): Promise<ActionResult> => {
      try {
        await apiClient.post(path, body);
        refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the server.' };
      }
    },
    [refresh],
  );

  return useMemo(() => {
    const activeRequest = state.active ? state.accepted[state.active.requestId] : undefined;
    const openRequests = state.requests.filter(r => r.status === 'open');
    const assignmentId = state.active?.assignmentId ?? activeRequest?.assignmentId;

    // Demo mode keeps counting from the seeded totals as trips are completed.
    const newTrips = LIVE ? [] : state.trips.filter(t => !seedIds.has(t.id));
    const addedEarning = newTrips.reduce((s, t) => s + t.earning, 0);
    const addedKm = newTrips.reduce((s, t) => s + t.km, 0);
    const addedDelivered = newTrips.filter(t => t.status === 'delivered').length;

    return {
      state,
      profile: state.profile,
      activeRequest,
      openRequests,
      statements: state.statements,
      today: LIVE
        ? state.today
        : {
            deliveries: TODAY_BASE.deliveries + addedDelivered,
            km: Math.round(TODAY_BASE.km + addedKm),
            earned: TODAY_BASE.earned + addedEarning,
            peakDone: Math.min(TODAY_BASE.peakTarget, TODAY_BASE.peakDone + addedDelivered),
            peakTarget: TODAY_BASE.peakTarget,
            peakReward: TODAY_BASE.peakReward,
          },
      week: LIVE
        ? state.week
        : {
            ...WEEK_BASE,
            trips: WEEK_BASE.trips + addedDelivered,
            km: Math.round(WEEK_BASE.km + addedKm),
            total: WEEK_BASE.total + addedEarning,
            base: WEEK_BASE.base + newTrips.reduce((s, t) => s + (t.breakdown?.base ?? 0), 0),
            distance: WEEK_BASE.distance + newTrips.reduce((s, t) => s + (t.breakdown?.distance ?? 0), 0),
            tips: WEEK_BASE.tips + newTrips.reduce((s, t) => s + t.tip, 0),
          },
      unread: state.notifications.filter(n => !n.read).length,
      request: (id: string) => state.accepted[id] ?? state.requests.find(r => r.id === id),
      trip: (id: string) => state.trips.find(t => t.id === id),
      refresh,
      actions: {
        setOnline: (on: boolean) => {
          dispatch({ type: 'setOnline', on });
          send(endpoints.delivery.online, { is_online: on });
        },
        skip: (id: string) => {
          const req = state.requests.find(r => r.id === id);
          dispatch({ type: 'skip', id });
          send(endpoints.delivery.rejectRequest, { assignment_id: req?.assignmentId });
        },
        accept: (id: string) => {
          const req = state.requests.find(r => r.id === id);
          dispatch({ type: 'accept', id });
          send(endpoints.delivery.acceptRequest, { assignment_id: req?.assignmentId });
        },
        reachStore: () => {
          dispatch({ type: 'reachStore' });
          send(endpoints.delivery.reachedStore, { assignment_id: assignmentId });
        },
        toggleCheck: (key: string) => dispatch({ type: 'toggleCheck', key }),
        /** The store reads out the code; the server checks it. */
        confirmPickup: async (code: string): Promise<ActionResult> => {
          if (!LIVE) {
            if (activeRequest && code !== activeRequest.handoverCode) {
              return { ok: false, error: "That code doesn't match. Ask the vendor to read it again." };
            }
            dispatch({ type: 'confirmPickup' });
            return { ok: true };
          }
          const result = await ask(endpoints.delivery.confirmPickup, { assignment_id: assignmentId, handover_code: code });
          if (result.ok) {
            dispatch({ type: 'confirmPickup' });
          }
          return result;
        },
        arrived: () => {
          dispatch({ type: 'arrived' });
          send(endpoints.delivery.arrived, { assignment_id: assignmentId });
        },
        /**
         * Uploads the photo and only then marks the trip as having proof — the
         * flag used to be set locally with nothing behind it. The stored path
         * goes on delivery_assignments.proof_photo.
         */
        proofPhoto: async (photo: { uri: string; name: string; type: string }): Promise<ActionResult> => {
          if (!assignmentId) {
            return { ok: false, error: 'No active delivery to attach a photo to.' };
          }
          try {
            await apiClient.upload(endpoints.delivery.uploadProof, photo, { assignment_id: String(assignmentId) });
            dispatch({ type: 'proofPhoto' });
            refresh();
            return { ok: true };
          } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : 'The photo could not be saved.' };
          }
        },
        /** The customer reads out the OTP; the server checks it. */
        complete: async (otp: string): Promise<ActionResult> => {
          if (!LIVE) {
            if (activeRequest && otp !== activeRequest.customerOtp) {
              return { ok: false, error: 'Incorrect OTP. Ask the customer to check the order screen again.' };
            }
            dispatch({ type: 'complete' });
            return { ok: true };
          }
          const result = await ask(endpoints.delivery.complete, {
            assignment_id: assignmentId,
            otp,
            proof_photo: state.active?.proofPhoto ?? false,
          });
          if (result.ok) {
            dispatch({ type: 'complete' });
          }
          return result;
        },
        rateHandover: (rating: 'slow' | 'fine' | 'quick') => {
          dispatch({ type: 'rateHandover', rating });
          send(endpoints.delivery.rateHandover, { assignment_id: assignmentId, rating });
        },
        finish: () => {
          dispatch({ type: 'finish' });
          refresh();
        },
        fail: (reason: string) => {
          dispatch({ type: 'fail', reason });
          send(endpoints.delivery.fail, { assignment_id: assignmentId, reason });
        },
        refreshRequests: () => {
          if (LIVE) {
            refresh();
          } else {
            dispatch({ type: 'refreshRequests' });
          }
        },
        setPref: (key: keyof State['prefs'], value: string | boolean) => {
          dispatch({ type: 'setPref', key, value });
          send(endpoints.delivery.preferences, { [key]: value });
        },
        readNotifications: () => {
          dispatch({ type: 'readNotifications' });
          send(endpoints.delivery.readNotifications, {});
        },
      },
    };
  }, [state, refresh, send, ask]);
}

const seedIds = new Set(seedTrips().map(t => t.id));

export function DeliveryStoreProvider({ children }: { children: React.ReactNode }) {
  const value = useDeliveryValue();
  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export const useDelivery = () => {
  const ctx = useContext(DeliveryContext);
  if (!ctx) {
    throw new Error('useDelivery must be used inside DeliveryStoreProvider');
  }
  return ctx;
};
