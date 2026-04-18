# PIH Advocacy Engage

This is a webapp to help the Partners in Health Engage team coordinate advocacy efforts.

TODO: fill out readme more fully

## Tech stack

- Next.js + typescript - FE + builds
- Supabase (postgres) - DB + auth
- Vercel - deployment
- Vitest + React Testing Library - unit tests
- Playwright - E2E tests
- Github actions - CI/CD

## Setup

### Prerequisites

- Node.js 18+
- Docker (required for local Supabase)
- Supabase CLI — install via Homebrew:

```bash
brew install supabase/tap/supabase
```

Or via npm:

```bash
npm install -g supabase
```

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

### Seed representatives data

Populate the `representatives` table with current members of Congress from the [congress-legislators](https://github.com/unitedstates/congress-legislators) dataset:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
  SUPABASE_SERVICE_ROLE_KEY=<secret key from supabase status output> \
  npx tsx scripts/seed-representatives.ts
```

This script is idempotent — it upserts current legislators and marks any previously stored representatives no longer in the dataset as `in_office = false`.

### Start the dev server

```bash
npm run dev
```

The app will be available at [localhost:3000](http://localhost:3000).

## Running tests

### Unit tests (Vitest)

Unit tests use [Vitest](https://vitest.dev/) with React Testing Library and [MSW](https://mswjs.io/) for network-level API mocking. No running server or database is required.

```bash
# Run all unit tests
npx vitest run

# Run in watch mode
npx vitest

# Run a specific test file
npx vitest run __tests__/components/representatives/senators-table.test.tsx
```

Test files live in `__tests__/` and shared MSW mocks are in `__tests__/mocks/`. Configuration is in `vitest.config.ts` and `vitest.setup.ts`.

### E2E tests (Playwright)

Ensure Supabase is running:

```bash
# Run all E2E tests
npx playwright test

# Run a specific test file
npx playwright test <file_name>

# Run with the Playwright UI
npx playwright test --ui
```

Snapshot tests require the app running at `localhost:3000`. The `webServer` config in `playwright.config.ts` starts the dev server automatically if it isn't already running.

### Updating visual snapshots

Snapshots are platform-specific (OS + browser). The recommended way to update them is via the **Update Playwright Snapshots** GitHub Action, which runs on Linux (matching the CI environment):

1. Go to **Actions → Update Playwright Snapshots** in the GitHub repository.
2. Click **Run workflow**, choose the branch, and run it.
3. The action adds a commit with the snapshot changes
4. Push another commit to trigger Github Actions (CI)
   1. You can use `git commit --allow-empty` if you just need to trigger the tests again

To update snapshots locally (for your platform only):

```bash
npx playwright test auth-regression sidebar-regression --update-snapshots
```

Note: locally generated snapshots will only match on the same OS and browser they were generated on. Prefer the GitHub Action for snapshots that need to pass in CI.
