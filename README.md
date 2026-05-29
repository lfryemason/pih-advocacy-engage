# PIH Advocacy Engage

This is a webapp to help Partners in Health Engage teams coordinate advocacy efforts.

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
npm run supabase:start
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

### Reset the local database and seed representatives

To reset migrations and populate the `representatives` table with current members of Congress:

```bash
npm run db:reset
```


To seed representatives without resetting migrations, first export your local Supabase credentials, then run the script:

```bash
eval "$(npx supabase status -o env)"
npx tsx scripts/seed-representatives.ts
```

> **Note:** `supabase db reset` alone will not seed representatives — use `npm run db:reset` for local development.

### Roles and bootstrapping a super admin

Every user has one of three roles stored in `public.user_role`:

- `member` — default role; read/write scoped to org-owned data
- `org_admin` — elevated write permissions on org-owned data (e.g. `representative_org_info`)
- `super_admin` — only role that can modify shared/reference data and promote users

Every user also has an `org_id` on their `user_role` row (except for super admin). There is no `organizations` table — the slug is fed from the `PIHE_ORG_ID` env var (defaults to `pihe`) and stamped onto `user_role.org_id` and `representative_org_info.org_id` at insert time. The auth trigger that creates a new user's role row hardcodes `'pihe'`; if you change `PIHE_ORG_ID`, update the `handle_new_user` trigger in `supabase/migrations/20260421225624_create_user_role.sql` to match.

New sign-ups are auto-assigned as `member` of the default org. Only a super admin can change another user's role, so the first super admin has to be promoted manually:

1. Sign up normally at `/auth/sign-up` (or have an existing user).
2. In Supabase Studio → SQL editor, find the user id:

```sql
select id, email from auth.users where email = 'you@example.com';
```

3. Promote the user (super admins must have `org_id = null`):

```sql
update public.user_role
   set role = 'super_admin', org_id = null
 where user_id = '<uuid>';
```

4. Log out and back in so server renders pick up the new role.

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
