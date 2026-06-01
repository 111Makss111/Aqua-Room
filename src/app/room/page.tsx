import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PrivateRoom } from '@/components/room/PrivateRoom';

export default async function RoomPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  return <PrivateRoom user={session.user} />;
}
