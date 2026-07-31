export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const browserStorage: StorageAdapter = {
  getItem(key) {
    return window.localStorage.getItem(key);
  },

  setItem(key, value) {
    window.localStorage.setItem(key, value);
  },

  removeItem(key) {
    window.localStorage.removeItem(key);
  },
};

export function readJson<T>(
  storage: StorageAdapter,
  key: string,
  fallback: T,
): T {
  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(
  storage: StorageAdapter,
  key: string,
  value: T,
): void {
  storage.setItem(key, JSON.stringify(value));
}
