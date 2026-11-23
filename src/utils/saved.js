import { useSyncExternalStore } from 'react';
import api from './api';

// The ids of hosts the signed-in member saved — loaded once and shared by every ♡ on screen.
let ids = null; // null until loaded
let loading = null;
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

const load = () => {
  if (!loading) {
    loading = api.get('saved/ids')
      .then((res) => { ids = new Set(res.data || []); })
      .catch(() => { ids = new Set(); })
      .finally(emit);
  }
  return loading;
};

const subscribe = (listener) => {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
};

/** The saved host ids (a Set), or null while loading. */
export const useSavedIds = () => useSyncExternalStore(subscribe, () => ids);

/** Saves or un-saves a host, updating every ♡ at once (and rolling back if the server says no). */
export const toggleSaved = async (userId) => {
  const wasSaved = !!ids?.has(userId);
  const flip = (save) => { ids = new Set(ids || []); if (save) ids.add(userId); else ids.delete(userId); emit(); };
  flip(!wasSaved);
  try {
    if (wasSaved) await api.delete(`saved/${encodeURIComponent(userId)}`);
    else await api.put(`saved/${encodeURIComponent(userId)}`);
  } catch (err) {
    flip(wasSaved);
    throw err;
  }
};
