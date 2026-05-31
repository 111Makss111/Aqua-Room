'use client';

import Link from 'next/link';
import { clearRoomUser } from '@/lib/roomSession';
import type { RoomUser } from '@/types/auth';
import { LoginMenu } from '@/components/auth/LoginMenu';

type TopBarProps = {
  googleReady: boolean;
  loginOpen: boolean;
  onLoginToggle: () => void;
  onLogout: () => void;
  user: RoomUser | null;
};

export function TopBar({
  googleReady,
  loginOpen,
  onLoginToggle,
  onLogout,
  user,
}: TopBarProps) {
  const firstName = user?.name?.split(' ')[0] || 'there';

  const handleLogout = () => {
    clearRoomUser();
    onLogout();
  };

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Aqua Room home">
        <span className="brand-orb" />
        <span>Aqua Room</span>
      </Link>

      <div className="topbar-actions">
        {!user ? (
          <>
            <button
              className="login-button"
              type="button"
              aria-expanded={loginOpen}
              aria-controls="login-menu"
              onClick={onLoginToggle}
            >
              Login
            </button>

            <LoginMenu
              googleReady={googleReady}
              isOpen={loginOpen}
              user={user}
            />
          </>
        ) : (
          <div className="session-actions">
            <span>Welcome, {firstName}</span>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Exit
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
