'use client';

import Script from 'next/script';
import { useState } from 'react';
import { AquariumScene } from '@/components/aquarium/AquariumScene';
import { TopBar } from '@/components/layout/TopBar';
import { useRoomSession } from '@/hooks/useRoomSession';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function HomeScreen() {
  const user = useRoomSession();
  const [googleReady, setGoogleReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <main className="aquarium-shell">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (GOOGLE_CLIENT_ID) {
            setGoogleReady(true);
          }
        }}
      />

      <AquariumScene />

      <TopBar
        googleReady={googleReady}
        loginOpen={loginOpen}
        onLoginToggle={() => setLoginOpen(current => !current)}
        onLogout={() => setLoginOpen(false)}
        user={user}
      />

      <section className="hero-content" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="sr-only">
            Aqua Room
          </h1>
        </div>
      </section>
    </main>
  );
}
