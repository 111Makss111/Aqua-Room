'use client';

import { useEffect, useRef, useState } from 'react';
import { createUserFromGoogleCredential } from '@/lib/googleCredential';
import { saveRoomUser } from '@/lib/roomSession';
import type { RoomUser } from '@/types/auth';
import type { GoogleButtonOptions } from '@/types/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SETUP_MESSAGE = 'Continue with Google';

type LoginMenuProps = {
  googleReady: boolean;
  isOpen: boolean;
  user: RoomUser | null;
};

type AuthTone = 'muted' | 'ok' | 'warn';

const googleButtonOptions: GoogleButtonOptions = {
  locale: 'uk',
  shape: 'pill',
  size: 'large',
  text: 'signin_with',
  theme: 'outline',
  type: 'standard',
};

const getInitialStatus = () => {
  if (!GOOGLE_CLIENT_ID) {
    return SETUP_MESSAGE;
  }

  return 'Loading Google sign-in.';
};

export function LoginMenu({ googleReady, isOpen, user }: LoginMenuProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(getInitialStatus);
  const [statusTone, setStatusTone] = useState<AuthTone>(
    GOOGLE_CLIENT_ID ? 'muted' : 'warn'
  );

  useEffect(() => {
    const buttonContainer = buttonContainerRef.current;

    if (!isOpen || user || !buttonContainer) {
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      buttonContainer.innerHTML =
        '<button class="google-placeholder-button" type="button" disabled>Google</button>';
      return;
    }

    if (!googleReady || !window.google?.accounts.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: response => {
        if (!response.credential) {
          setStatus('Google did not return a sign-in credential.');
          setStatusTone('warn');
          return;
        }

        const nextUser = createUserFromGoogleCredential(response.credential);
        saveRoomUser(nextUser);
      },
    });

    buttonContainer.innerHTML = '';
    window.google.accounts.id.renderButton(
      buttonContainer,
      googleButtonOptions
    );
    setStatus('Google sign-in is ready.');
    setStatusTone('ok');
  }, [googleReady, isOpen, user]);

  if (!isOpen || user) {
    return null;
  }

  return (
    <section className="auth-menu" id="login-menu" aria-label="Google login">
      <div className="google-button-shell" ref={buttonContainerRef} />
      <p className="auth-status" data-tone={statusTone} role="status">
        {status}
      </p>
    </section>
  );
}
