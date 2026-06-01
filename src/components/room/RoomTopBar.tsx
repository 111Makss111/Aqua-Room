'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';

type RoomTopBarProps = {
  user: Session['user'];
};

function getInitials(name?: string | null, email?: string | null) {
  const fallback = email?.slice(0, 2) ?? 'AR';

  if (!name) {
    return fallback.toUpperCase();
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export function RoomTopBar({ user }: RoomTopBarProps) {
  const initials = getInitials(user?.name, user?.email);

  return (
    <header className="room-topbar">
      <Link className="room-brand" href="/">
        <span className="brand-orb" />
        <span>Aqua Room</span>
      </Link>

      <div className="room-user-panel">
        <span className="room-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="room-user-copy">
          <strong>{user?.name ?? 'Приватний гість'}</strong>
          <span>{user?.email ?? 'Вхід виконано'}</span>
        </span>
        <button
          className="room-exit-button"
          type="button"
          onClick={() => signOut({ redirectTo: '/' })}
        >
          Вийти
        </button>
      </div>
    </header>
  );
}
