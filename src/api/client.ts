import { API_PREFIX, DEFAULT_API_BASE_URL, REQUEST_TIMEOUT_MS } from '@config/constants';

import { ApiError, NetworkError } from './errors';
import { storage } from './storage';

type Envelope<T> = { status: number; message?: string } & T;

const BASE_URL_KEY = 'partner.baseUrl';
const TOKEN_KEY = 'partner.token';

let baseUrl = DEFAULT_API_BASE_URL;
let authToken: string | null = null;

/** "192.168.1.5" → "http://192.168.1.5:2407", and no trailing slash. */
export const normaliseBaseUrl = (value: string) => {
  let url = value.trim();
  if (!url) {
    return DEFAULT_API_BASE_URL;
  }
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  if (!/:\d+$/.test(url.replace(/\/+$/, ''))) {
    url = `${url.replace(/\/+$/, '')}:2407`;
  }
  return url.replace(/\/+$/, '');
};

export const getBaseUrl = () => baseUrl;

export const setBaseUrl = async (value: string) => {
  baseUrl = normaliseBaseUrl(value);
  await storage.set(BASE_URL_KEY, baseUrl);
  return baseUrl;
};

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  if (token) {
    await storage.set(TOKEN_KEY, token);
  } else {
    await storage.remove(TOKEN_KEY);
  }
};

export const getAuthToken = () => authToken;

/**
 * First run, with nothing saved: try the addresses that work without being
 * typed in. `localhost` is the phone itself unless `adb reverse tcp:2407
 * tcp:2407` is running, which is the usual USB setup; 10.0.2.2 is the host as
 * seen from the emulator. A phone on Wi-Fi needs the PC's LAN address, which
 * only the Server screen can supply.
 */
const CANDIDATES = ['http://localhost:2407', DEFAULT_API_BASE_URL];

const answers = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${url}/`, { method: 'GET', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/** Reads the saved address and token on startup; returns the token, if any. */
export const restoreClient = async () => {
  const [savedUrl, savedToken] = await Promise.all([storage.get(BASE_URL_KEY), storage.get(TOKEN_KEY)]);
  if (savedUrl) {
    baseUrl = savedUrl;
  } else {
    for (const candidate of CANDIDATES) {
      if (await answers(candidate)) {
        baseUrl = candidate;
        break;
      }
    }
  }
  authToken = savedToken;
  return savedToken;
};

const request = async <T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError(`Could not reach ${baseUrl}. Check the server address and your connection.`);
  } finally {
    clearTimeout(timer);
  }

  let payload: Envelope<T>;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(response.status === 404 ? 404 : 500, 'Unreadable response from the server');
  }

  // The backend reports application failures inside the response body.
  if (payload.status !== 200) {
    throw new ApiError(payload.status, payload.message ?? 'Request failed');
  }

  return payload as unknown as T;
};

export const apiClient = {
  get: <T>(path: string) => request<T>(path, 'GET'),
  post: <T>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  setAuthToken,
  getAuthToken,
  setBaseUrl,
  getBaseUrl,
  restoreClient,
};
