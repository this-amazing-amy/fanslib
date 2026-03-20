export type ActivityLogEntry = {
  timestamp: number;
  type: 'success' | 'warning' | 'error';
  message: string;
};

const STORAGE_KEY = 'fanslib_activity_log';
const MAX_ENTRIES = 100;

const getStorage = (): typeof chrome.storage.local | null => {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return chrome.storage.local;
  }
  return null;
};

export const addLogEntry = async (
  entry: Omit<ActivityLogEntry, 'timestamp'>
): Promise<void> => {
  const storage = getStorage();

  if (!storage) {
    // Test mode fallback using localStorage
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: ActivityLogEntry[] = raw ? JSON.parse(raw) : [];
      const newEntry: ActivityLogEntry = {
        ...entry,
        timestamp: Date.now(),
      };
      const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return;
  }

  const result = await storage.get(STORAGE_KEY);
  const existing: ActivityLogEntry[] =
    (result[STORAGE_KEY] as ActivityLogEntry[] | undefined) ?? [];

  const newEntry: ActivityLogEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
  await storage.set({ [STORAGE_KEY]: updated });
};

export const getActivityLog = async (): Promise<ActivityLogEntry[]> => {
  const storage = getStorage();

  if (!storage) {
    // Test mode fallback using localStorage
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  }

  const result = await storage.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as ActivityLogEntry[] | undefined) ?? [];
};

export const clearActivityLog = async (): Promise<void> => {
  const storage = getStorage();

  if (!storage) {
    // Test mode fallback using localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }

  await storage.set({ [STORAGE_KEY]: [] });
};
