import type { RoomUser } from '@/types/auth';

type GoogleCredentialPayload = {
  email?: string;
  name?: string;
  picture?: string;
};

const decodeJwtPayload = (token: string) => {
  const payload = token.split('.')[1];

  if (!payload) {
    throw new Error('Google credential payload is missing.');
  }

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(char => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );

  return JSON.parse(json) as GoogleCredentialPayload;
};

export const createUserFromGoogleCredential = (credential: string): RoomUser => {
  const payload = decodeJwtPayload(credential);

  return {
    email: payload.email,
    issuedAt: Date.now(),
    name: payload.name,
    picture: payload.picture,
  };
};
