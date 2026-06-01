import type { Session } from 'next-auth';
import { RoomTopBar } from '@/components/room/RoomTopBar';
import { RoomWorkspace } from '@/components/room/RoomWorkspace';

type PrivateRoomProps = {
  user: Session['user'];
};

export function PrivateRoom({ user }: PrivateRoomProps) {
  const firstName = user?.name?.split(' ')[0] ?? 'гостю';

  return (
    <main className="room-shell">
      <div className="room-watermark" aria-hidden="true" />

      <section className="room-panel" aria-labelledby="room-title">
        <RoomTopBar user={user} />

        <div className="room-hero">
          <div className="room-copy">
            <p className="room-kicker">Приватна кімната</p>
            <h1 id="room-title">Вітаю, {firstName}</h1>
            <p>
              Перший шар входу вже захищений. Ця кімната поки навмисно
              спокійна, щоб глибші інструменти додавались поступово.
            </p>
          </div>
        </div>

        <RoomWorkspace />
      </section>
    </main>
  );
}
