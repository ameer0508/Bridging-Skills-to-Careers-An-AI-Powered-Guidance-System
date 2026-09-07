export const StorageService = {
  getItem<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return fallback;
      }
      const item = window.localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

export default StorageService;
