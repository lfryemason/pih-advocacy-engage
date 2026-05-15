# PIH Advocacy Engage Constitution

## Principles

**I. Code Quality** — Code is self-documenting through well-named identifiers. Comments are
forbidden except to explain WHY a non-obvious complexity exists. No premature abstractions, no
dead code, no backwards-compatibility shims.

**II. Unit Tests** — All code MUST have unit tests (Vitest + React Testing Library). Tests
validate behavior, not implementation details. ≥80% line/branch coverage enforced in CI for new
code.

**III. E2E Tests** — Every major feature MUST have Playwright E2E tests covering at least the
primary happy path. Failing E2E tests block merge to main.

**IV. Accessibility Tests** — Every major feature MUST have axe-core a11y tests (via Playwright)
asserting zero critical/serious WCAG 2.1 AA violations. Failing a11y tests block merge to main.

**V. Snapshot Tests** — Every major feature's UI components MUST have snapshot tests (Vitest).
Snapshots MUST be reviewed and intentionally updated — never auto-accepted. Snapshot tests run in
CI only; local execution is not expected.

## CI Gates (all PRs)

- Vitest unit tests pass, ≥80% coverage on new code
- Playwright E2E + a11y tests pass (major features)
- Snapshot tests pass; diffs require reviewer sign-off
- TypeScript: zero errors
- Linter: no new suppressions without justification

No gate may be bypassed, including for hotfixes.

## Governance

Amendments require a written rationale, team approval, and a semver bump (MAJOR: principle
removal/redefinition; MINOR: new principle; PATCH: clarification). All PRs verify compliance
with Principles I–V.

**Version**: 1.0.1 | **Ratified**: 2026-05-15 | **Last Amended**: 2026-05-15
