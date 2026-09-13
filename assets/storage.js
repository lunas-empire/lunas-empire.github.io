// Only personal checklist preferences are stored. No account/game data or credentials.
export function createStorage(provider, onError = () => {}) {
  const memory = new Map();
  return {
    get(key, fallback = {}) {
      try {
        const raw = provider()?.getItem(key);
        if (raw !== null && raw !== undefined) return JSON.parse(raw);
      } catch { onError(); }
      return memory.has(key) ? memory.get(key) : fallback;
    },
    set(key, value) {
      memory.set(key, value);
      try { provider()?.setItem(key, JSON.stringify(value)); }
      catch { onError(); }
    },
  };
}
export function checkedMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([,v]) => v === true));
}
