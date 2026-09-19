import { API_PREFIX, DEFAULT_API_BASE_URL, DEV_LAN_BASE_URL, REQUEST_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from '@config/constants';

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
  addressIsChosen = true;
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
 * seen from the emulator; DEV_LAN_BASE_URL is the machine the app was built on,
 * which is where a phone on the same Wi-Fi finds it. If none of them answer, the
 * address has to come from the Server screen.
 */
const CANDIDATES = ['http://localhost:2407', DEFAULT_API_BASE_URL, DEV_LAN_BASE_URL];

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

/** True once an address has been typed in on the Server screen: stop guessing. */
let addressIsChosen = false;

/**
 * Looks for a backend among the candidates. Nothing answers when the phone has
 * not joined the network yet — mobile data instead of Wi-Fi is the usual
 * reason — so it settles on the LAN address, which is the one that becomes
 * reachable once it does, rather than the emulator's.
 */
const probe = async () => {
  for (const candidate of CANDIDATES) {
    if (await answers(candidate)) {
      baseUrl = candidate;
      return true;
    }
  }
  baseUrl = DEV_LAN_BASE_URL;
  return false;
};

/** Reads the saved address and token on startup; returns the token, if any. */
export const restoreClient = async () => {
  const [savedUrl, savedToken] = await Promise.all([storage.get(BASE_URL_KEY), storage.get(TOKEN_KEY)]);
  if (savedUrl) {
    baseUrl = savedUrl;
    addressIsChosen = true;
  } else {
    await probe();
  }
  authToken = savedToken;
  return savedToken;
};

const request = async <T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const send = () =>
    fetch(`${baseUrl}${API_PREFIX}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  let response: Response;
  try {
    try {
      response = await send();
    } catch (unreachable) {
      // The address was guessed before the phone had a network, or it moved to
      // another one. Look again and retry, so turning Wi-Fi on and pressing the
      // button a second time is enough — no restart, no typing an address.
      if (addressIsChosen || !(await probe())) {
        throw unreachable;
      }
      response = await send();
    }
  } catch {
    throw new NetworkError(
      `Could not reach ${baseUrl}. Check that the phone is on the same Wi-Fi as the server, or set the address under "Server settings".`,
    );
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

/**
 * Uploads one image as multipart/form-data. The Content-Type header is left
 * unset on purpose: fetch fills in the multipart boundary, and naming the type
 * ourselves would drop it and the server would parse nothing.
 */
const upload = async <T>(path: string, file: { uri: string; name: string; type: string }, fields: Record<string, string> = {}): Promise<T> => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  // React Native's FormData takes this shape for a file; the cast is for the DOM type.
  form.append('photo', file as unknown as Blob);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: form,
    });
  } catch {
    throw new NetworkError(`Could not reach ${baseUrl} to upload the photo.`);
  } finally {
    clearTimeout(timer);
  }

  let payload: Envelope<T>;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(500, 'The server did not accept the photo.');
  }
  if (payload.status !== 200) {
    throw new ApiError(payload.status, payload.message ?? 'The photo could not be saved.');
  }
  return payload as unknown as T;
};

export const apiClient = {
  get: <T>(path: string) => request<T>(path, 'GET'),
  post: <T>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  upload,
  setAuthToken,
  getAuthToken,
  setBaseUrl,
  getBaseUrl,
  restoreClient,
};
