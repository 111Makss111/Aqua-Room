'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { LoginMenu } from '@/components/auth/LoginMenu';

type TopBarProps = {
  loginOpen: boolean;
  onLoginToggle: () => void;
  onLogout: () => void;
  user: Session['user'] | null;
};

export function TopBar({
  loginOpen,
  onLoginToggle,
  onLogout,
  user,
}: TopBarProps) {
  const firstName = user?.name?.split(' ')[0] || 'there';

  const handleLogout = () => {
    onLogout();
    signOut({ redirectTo: '/' });
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
              isOpen={loginOpen}
              user={user}
            />
          </>
        ) : (
          <div className="session-actions">
            <span>Welcome, {firstName}</span>
            <Link className="room-link" href="/room">
              Room
            </Link>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Exit
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
