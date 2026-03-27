# PIH Advocacy Engage

This is a webapp to help the Partners in Health Engage team coordinate advocacy efforts.

TODO: fill out readme more fully

## Tech stack

- Next.js + typescript - FE + builds
- Supabase (postgres) - DB + auth
- Vercel - deployment
- Playwright - E2E tests
- Github actions - CI/CD
- Material UI - FE components

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

## Running tests

Ensure the dev server and Supabase are running, then:

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test <file_name>

# Run with the Playwright UI
npx playwright test --ui
```

Snapshot tests require the app running at `localhost:3000`. The `webServer` config in `playwright.config.ts` starts the dev server automatically if it isn't already running.

### Test user

Tests that require authentication use a shared test account (`playwright@example.com` / `Playwright1!`). A global setup step creates this account automatically on the first run via the sign-up flow, so no manual setup is needed. Auth state is saved to `playwright/.auth/user.json` (gitignored) and reused across tests.

If you reset the local Supabase database (`supabase db reset`), the test user is recreated from `supabase/seed.sql` and the next `npx playwright test` run will re-authenticate.

### Updating visual snapshots

Snapshots are platform-specific (OS + browser). The recommended way to update them is via the **Update Playwright Snapshots** GitHub Action, which runs on Linux (matching the CI environment):

1. Go to **Actions → Update Playwright Snapshots** in the GitHub repository.
2. Click **Run workflow**, choose the branch, and run it.
3. The action opens a PR with the updated snapshot files.

To update snapshots locally (for your platform only):

```bash
npx playwright test auth-regression sidebar-regression --update-snapshots
```

Note: locally generated snapshots will only match on the same OS and browser they were generated on. Prefer the GitHub Action for snapshots that need to pass in CI.
