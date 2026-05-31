import type { RoomUser } from '@/types/auth';

const SESSION_KEY = 'aqua-room-session';
const SESSION_CHANGE_EVENT = 'aqua-room-session-change';

const notifySessionChanged = () => {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
};

export const parseRoomUser = (saved: string | null) => {
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as RoomUser;
  } catch {
    return null;
  }
};

export const saveRoomUser = (user: RoomUser) => {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  notifySessionChanged();
};

export const clearRoomUser = () => {
  window.sessionStorage.removeItem(SESSION_KEY);
  window.google?.accounts.id.disableAutoSelect();
  notifySessionChanged();
};

export const subscribeToRoomSession = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(SESSION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(SESSION_CHANGE_EVENT, onStoreChange);
  };
};

export const getRoomSessionSnapshot = () =>
  window.sessionStorage.getItem(SESSION_KEY);

export const getServerRoomSessionSnapshot = () => null;
