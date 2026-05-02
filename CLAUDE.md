# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevHub is a single-user developer portfolio and activity dashboard that aggregates data from GitHub, GitLab, Bitbucket, Slack, and Zoho Mail into a unified view. It has two surfaces: a public portfolio site and a private dashboard.

## Commands

### Root (run from `D:\saas\devhub`)
```sh
pnpm build               # typecheck all packages, then build each artifact
pnpm typecheck           # typecheck libs + artifacts
```

### API Server (`artifacts/api-server`)
```sh
pnpm dev                 # start Express server with watch mode
pnpm build               # esbuild to dist/
pnpm typecheck
```

### Dashboard (`artifacts/dev-dashboard`)
```sh
pnpm dev                 # Vite dev server on port 20934
pnpm build               # Vite production build
pnpm serve               # serve built output
pnpm typecheck           # vue-tsc
```

### Database (`lib/db`)
```sh
pnpm push                # apply Drizzle migrations
pnpm push-force          # force apply (destructive)
```
Requires `DATABASE_URL` env var pointing to PostgreSQL.

### API Code Generation (`lib/api-spec`)
```sh
pnpm codegen             # regenerate React Query hooks + Zod validators from openapi.yaml
```

## Architecture

### Monorepo (pnpm workspaces)
- **`artifacts/api-server`** — Express 5 API on port 8080; handles all platform integrations server-side
- **`artifacts/dev-dashboard`** — Vue 3 + Vite frontend on port 20934; both the public portfolio and private dashboard (no component library — hand-crafted with Tailwind CSS v4)
- **`lib/db`** — Drizzle ORM schema and PostgreSQL client (shared by API server)
- **`lib/api-spec`** — OpenAPI 3.1 spec (`openapi.yaml`) is the source of truth for API contracts
- **`lib/api-client-react`** — Generated React Query hooks (do not edit manually)
- **`lib/api-zod`** — Generated Zod validators (do not edit manually)

### API Code Generation Pipeline
Edit `lib/api-spec/openapi.yaml` → run `pnpm codegen` in `lib/api-spec` → commits both `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`. Never hand-edit generated files.

### Single-User Pattern
The fixed profile UUID `00000000-0000-0000-0000-000000000001` is used throughout the app — there is no multi-tenancy or authentication system. Platform OAuth tokens are stored in the `connected_platforms` table server-side only and never sent to the browser.

### Database Schema (Drizzle ORM / PostgreSQL)
Four tables: `profiles`, `connected_platforms`, `activity_feed`, `projects`. Key quirk: `current_role` is a PostgreSQL reserved keyword — always quote it in raw SQL.

### Frontend Routing
Uses Vue Router 4. Public portfolio at `/`; dashboard pages under `/dashboard/*`. Path alias `@/*` maps to `src/*`.

## Key Constraints

- **No Twitter/X integration** — explicitly removed; do not add it back.
- **pnpm only** — a preinstall hook blocks npm and yarn.
- **Package release age** — `pnpm-workspace.yaml` enforces a 1-day minimum release age for all npm packages (supply-chain defense).
- **Platform colors** — each platform has a canonical brand color defined in `replit.md`; keep UI consistent with those.
- **Replit deployment** — `.replit` and `scripts/post-merge.sh` configure the Replit environment. The Vite config detects `REPL_ID` to enable dev-only plugins (Cartographer, runtime error overlay).
