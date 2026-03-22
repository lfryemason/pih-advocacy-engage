# PIH Advocacy Engage
This is a webapp to help the Partners in Health Engage team coordinate advocacy efforts.

TODO: fill out readme more fully

## Tech stack

* Next.js + typescript - FE + builds
* Supabase (postgres) - DB + auth
* Vercel - deployment
* Playwright - E2E tests
* Github actions - CI/CD
* Material UI - FE components

## Setup

### Prerequisites

- Node.js 18+
- Docker (required for local Supabase)
- Supabase CLI — install via Homebrew:

### Install dependencies

```bash
npm install
```

### Option A: Use a remote Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard/projects)
2. Copy your project URL and publishable (anon) key from **Project Settings > API**
3. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-or-anon-key>
```

### Option B: Run Supabase locally (recommended)

1. Initialize Supabase in the project (first time only):

```bash
supabase init
```

2. Start the local Supabase stack (requires Docker):

```bash
supabase start
```

This starts a local Postgres database, Auth server, and API. Once running, the CLI prints connection details — copy the `API URL` and `anon key` values.

3. Set `.env.local` to point at your local instance:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from supabase start output>
```

4. To stop the local stack:

```bash
supabase stop
```

#### Email confirmation
To login, you need to confirm emails, however local Supabase doesn't send real emails. Instead, all emails (including confirmation links) are caught by **Inbucket**, a local inbox available at [localhost:54324](http://localhost:54324).

To skip email confirmation entirely in local dev, add this to `supabase/config.toml`:

```toml
[auth.email]
enable_confirmations = false
```

Then restart the local stack for the change to take effect.

### Start the dev server

```bash
npm run dev
```

The app will be available at [localhost:3000](http://localhost:3000).
