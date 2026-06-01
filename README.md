## Aqua Room

Private Next.js + TypeScript project for a calm Google-protected entry screen.

### Project structure

```text
src/app/
  layout.tsx        App shell and metadata
  page.tsx          Home route
  room/page.tsx     Private room placeholder after login
  globals.css      Global styles split into visual sections

src/components/
  HomeScreen.tsx    Assembles the page sections
  aquarium/         Aquarium background, water movement, geyser
  auth/             Auth provider and Google login menu
  layout/           Top navigation
  room/             Private room placeholder components

src/lib/
  Reserved for app helpers as the project grows

src/app/api/auth/
  [...nextauth]/route.ts Auth.js server route for Google OAuth

src/auth.ts         Auth.js configuration
proxy.ts            Protects private routes
```

### Local setup

1. Copy `.env.example` to `.env.local`.
2. Add a Google OAuth web client ID:

```env
AUTH_SECRET=generate-a-long-random-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
AUTH_URL=http://localhost:3000
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
8. Add these authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://your-project.vercel.app/api/auth/callback/google
```

9. Copy the client ID and client secret into `.env.local`:

```env
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-client-secret
```

10. Add an auth secret to `.env.local`:

```env
AUTH_SECRET=some-long-random-string
```

11. Keep the local URL in `.env.local`:

```env
AUTH_URL=http://localhost:3000
```

12. Restart the dev server after changing `.env.local`.

The app now uses Auth.js / NextAuth for a server-side OAuth callback and a
cookie-backed session. Before adding sensitive data, we should still add the
extra protection layer we discussed.
