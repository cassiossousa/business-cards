# Business Cards

Design and print business cards. The current milestone is a working full-stack
foundation: create, list, and delete named card projects, with a Vue frontend,
a Fastify API, and SQLite persistence. The UI offers light, dark, and system
color themes in the header; the choice persists locally and the default
follows your OS setting.

## Prerequisites

- Node.js 24 (the version used to generate the lockfile). The major version
  is pinned in `.nvmrc` (run `nvm use` if you use nvm), CI installs that same
  version, and npm enforces the range from `engines` (`engine-strict` in
  `.npmrc`).

## Getting started

```bash
npm install
npm run dev
```

This starts both workspaces together:

- Web (Vite dev server): http://localhost:5173
- API (Fastify): http://localhost:8787

The API stores its data in `apps/api/data/business-cards.db` (created on first
run; ignored by Git).

## Commands

Run from the repository root:

| Command                  | What it does                               |
| ------------------------ | ------------------------------------------ |
| `npm run dev`            | Start the API and web dev servers together |
| `npm run dev:api`        | Start only the API                         |
| `npm run dev:web`        | Start only the web dev server              |
| `npm test`               | Run tests with coverage thresholds         |
| `npm run test:watch`     | Run tests in watch mode                    |
| `npm run tsc`            | Type-check all workspaces                  |
| `npm run lint`           | Lint the repository with ESLint            |
| `npm run prettier:check` | Check formatting with Prettier             |
| `npm run prettier`       | Format the repository with Prettier        |
| `npm run build`          | Production build of all workspaces         |

## Test coverage

`npm test` runs Vitest with coverage in both workspaces and enforces a
minimum of 70% lines, branches, functions, and statements **per source
file** — an untested file fails the run instead of hiding in the combined
total. Files with no testable runtime behavior are exempt: the process and
bootstrap entry points (`apps/api/src/server.ts`, `apps/web/src/main.ts`)
and the type-only module `apps/web/src/api/types.ts`.

## Git hooks

`npm install` activates Git hooks via Husky (the `prepare` script):

- **pre-commit** runs lint-staged: ESLint (`--fix`) and Prettier (`--write`)
  on staged files, re-staging any fixes automatically.
- **commit-msg** validates the commit message with commitlint.

## Commit messages

Commit messages follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add project deletion
fix: align the create button with the input field
```

The allowed types include `feat`, `fix`, `docs`, `style`, `refactor`,
`test`, `build`, `ci`, `chore`, and `revert`.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on every pull
request. It installs dependencies with `npm ci` and runs the same checks as
the local workflow: tests, type checks, lint, formatting check, and build.

## Configuration

Both apps run with sensible local defaults and need no secrets. To override,
copy the example files and adjust:

- `apps/api/.env.example` → `apps/api/.env` — `PORT`, `HOST`,
  `DATABASE_PATH`, `CORS_ORIGIN`
- `apps/web/.env.example` → `apps/web/.env` — `VITE_API_ORIGIN` (the origin
  the frontend calls)

`CORS_ORIGIN` must match the origin the frontend is served from; the default
covers the local dev servers.

## Structure

```
apps/
  api/    Fastify + TypeScript + SQLite (better-sqlite3)
    src/
      app.ts                      App factory (routes, error mapping, CORS)
      server.ts                   Process entry point (listen, shutdown)
      db/database.ts              Connection + migration runner
      modules/card-project/       Routes, service (validation), repository (SQL)
    tests/                        Service, repository, migration, HTTP tests
  web/    Vue 3 + TypeScript + Vite
    src/
      api/                        API client and response contract types
      pages/projects/ProjectListPage  Projects UI (create, list, delete)
```

Layering is UI / HTTP → service (use cases + validation) → repository (SQL).
HTTP integration tests use Fastify's `inject` (no port); frontend tests mock
the API boundary and need no backend.

## Current limitations

- Projects are names only; there is no card editor, template catalog, or
  print/export support yet.
- There are no user accounts; all projects are local to the database file.
- The API is intended for local development; there is no deployment setup.
