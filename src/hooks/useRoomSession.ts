'use client';

import { useSyncExternalStore } from 'react';
import {
  getRoomSessionSnapshot,
  getServerRoomSessionSnapshot,
  parseRoomUser,
  subscribeToRoomSession,
} from '@/lib/roomSession';

export const useRoomSession = () => {
  const sessionSnapshot = useSyncExternalStore(
    subscribeToRoomSession,
    getRoomSessionSnapshot,
    getServerRoomSessionSnapshot
  );

  return parseRoomUser(sessionSnapshot);
};
