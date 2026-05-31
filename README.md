## Aqua Room

Private Next.js + TypeScript project for a calm Google-protected entry screen.

### Project structure

```text
src/app/
  layout.tsx        App shell and metadata
  page.tsx          Home route
  globals.css      Global styles split into visual sections

src/components/
  HomeScreen.tsx    Assembles the page sections
  aquarium/         Aquarium background, water movement, geyser
  auth/             Google login menu
  layout/           Top navigation

src/hooks/
  useRoomSession.ts Reads the browser session state

src/lib/
  googleCredential.ts Parses the Google credential
  roomSession.ts      Saves and clears the local session

src/types/
  auth.ts           App user type
  google.ts         Google Identity Services types
```

### Local setup

1. Copy `.env.example` to `.env.local`.
2. Add a Google OAuth web client ID:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

3. Run the app:

```bash
npm run dev
```

`.env.local`, exports, spreadsheets, local databases, and private notes are ignored by Git.

### Google login setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Go to `APIs & Services` -> `OAuth consent screen`.
4. Configure the app name and add your email as a test user.
5. Go to `APIs & Services` -> `Credentials`.
6. Create `OAuth client ID`.
7. Choose `Web application`.
8. Add this authorized JavaScript origin for local development:

```text
http://localhost:3000
```

9. Copy the client ID into `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

10. Restart the dev server after changing `.env.local`.

Current login is only the first browser-side layer. Before adding private data,
database access, or sensitive features, add server-side verification of the
Google credential and the extra protection layer we discussed.
