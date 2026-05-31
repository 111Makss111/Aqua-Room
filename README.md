## Aqua Room

Private Next.js + TypeScript project for a calm Google-protected entry screen.

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
