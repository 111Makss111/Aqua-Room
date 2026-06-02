import type { Session } from 'next-auth';
import { RoomWorkspace } from '@/components/room/RoomWorkspace';

type PrivateRoomProps = {
  user: Session['user'];
};

export function PrivateRoom({ user }: PrivateRoomProps) {
  return (
    <main className="room-shell">
      <section className="room-panel" aria-label="Приватний кабінет">
        <RoomWorkspace user={user} />
      </section>
    </main>
  );
}
