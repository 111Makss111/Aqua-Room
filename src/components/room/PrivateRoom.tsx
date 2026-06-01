import Link from 'next/link';
import type { Session } from 'next-auth';

type PrivateRoomProps = {
  user: Session['user'];
};

export function PrivateRoom({ user }: PrivateRoomProps) {
  const firstName = user?.name?.split(' ')[0] ?? 'Guest';

  return (
    <main className="room-shell">
      <section className="room-panel" aria-labelledby="room-title">
        <Link className="room-back-link" href="/">
          Aqua Room
        </Link>

        <div className="room-copy">
          <p className="room-kicker">Private space</p>
          <h1 id="room-title">Welcome, {firstName}</h1>
          <p>
            The entry layer is ready. This area is intentionally quiet for now,
            so future private sections can be added carefully.
          </p>
        </div>
      </section>
    </main>
  );
}
