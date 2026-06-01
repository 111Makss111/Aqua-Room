'use client';

import type { Session } from 'next-auth';
import { signIn } from 'next-auth/react';

type LoginMenuProps = {
  isOpen: boolean;
  user: Session['user'] | null;
};

export function LoginMenu({ isOpen, user }: LoginMenuProps) {
  if (!isOpen || user) {
    return null;
  }

  return (
    <section className="auth-menu" id="login-menu" aria-label="Google login">
      <button
        className="google-auth-button"
        type="button"
        onClick={() => signIn('google', { redirectTo: '/room' })}
      >
        Continue with Google
      </button>
    </section>
  );
}
