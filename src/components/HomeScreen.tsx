'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AquariumScene } from '@/components/aquarium/AquariumScene';
import { TopBar } from '@/components/layout/TopBar';

export function HomeScreen() {
  const { data: session } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <main className="aquarium-shell">
      <AquariumScene />

      <TopBar
        loginOpen={loginOpen}
        onLoginToggle={() => setLoginOpen(current => !current)}
        onLogout={() => setLoginOpen(false)}
        user={session?.user ?? null}
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
