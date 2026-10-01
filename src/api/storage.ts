/**
 * Small key/value wrapper around AsyncStorage for app data.
 *
 * AsyncStorage is a native module: it is missing in Jest and in any build made
 * before it was added, so every call falls back to an in-memory map rather than
 * crashing the app.
 */

type Backend = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

const memoryBackend: Backend = {
  getItem: async key => memory.get(key) ?? null,
  setItem: async (key, value) => {
    memory.set(key, value);
  },
  removeItem: async key => {
    memory.delete(key);
  },
};

const load = (): Backend => {
  try {
    const mod = require('@react-native-async-storage/async-storage');
    const native = (mod?.default ?? mod) as Backend | undefined;
    return native?.getItem ? native : memoryBackend;
  } catch {
    return memoryBackend;
  }
};

const backend = load();

export const storage = {
  get: async (key: string) => {
    try {
      return await backend.getItem(key);
    } catch {
      return null;
    }
  },
  set: async (key: string, value: string) => {
    try {
      await backend.setItem(key, value);
    } catch {
      // A device with no storage still works for the current session.
    }
  },
  remove: async (key: string) => {
    try {
      await backend.removeItem(key);
    } catch {
      // Ignored for the same reason.
    }
  },
};
