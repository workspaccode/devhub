# DevHub — Personal Developer Portfolio & Activity Dashboard

A single-user developer portfolio and activity dashboard connecting GitHub, GitLab, Bitbucket, Slack, and Zoho Mail.

## Architecture

**Monorepo** managed by pnpm workspaces:

| Package | Purpose |
|---|---|
| `artifacts/api-server` | Express API server (port 8080) |
| `artifacts/dev-dashboard` | React + Vite frontend (port 20934) |
| `lib/db` | Drizzle ORM schema + PostgreSQL client |
| `lib/api-spec` | OpenAPI spec + orval codegen config |
| `lib/api-client-react` | Generated React Query hooks (from orval) |
| `lib/api-zod` | Generated Zod validators (from orval) |

## Routing

Replit proxy routes by path:
- `/api/*` → API server (port 8080)
- `/*` → Frontend dev server (port 20934)

## Pages

### Public Portfolio (`/`)
- Hero with profile, skills, work status badge
- Featured projects grid (status badges, star/fork counts)
- Recent activity feed across all platforms
- Contact section

### Dashboard (`/dashboard/*`)
- **Overview** — stats (open issues, PRs, projects, connected count, streak), activity feed, platform status cards
- **Issues** (`/dashboard/issues`) — GitHub issues viewer with state/filter tabs, grouped by repo, label chips
- **Activity** (`/dashboard/activity`) — unified feed with per-platform tab filter
- **GitHub** (`/dashboard/github`) — contribution heatmap, repos list, recent events
- **GitLab** (`/dashboard/gitlab`) — projects, merge requests by state
- **Bitbucket** (`/dashboard/bitbucket`) — repos, pull requests by state
- **Slack** (`/dashboard/slack`) — workspace info, channels list, recent messages
- **Projects** (`/dashboard/projects`) — CRUD for portfolio projects with modal form
- **Connections** (`/dashboard/connections`) — connect/disconnect/sync platforms via token modal
- **Profile** (`/dashboard/profile`) — edit name, bio, title, skills, company, role, links

## Database

Replit PostgreSQL via `DATABASE_URL`. Schema in `lib/db/src/schema/index.ts`:
- `profiles` — single user profile (`id = 00000000-0000-0000-0000-000000000001`)
- `connected_platforms` — per-platform OAuth tokens and sync state
- `activity_feed` — unified activity across all platforms
- `projects` — portfolio projects

**Note:** `current_role` is a PostgreSQL reserved keyword — always quote it in raw SQL.

## API Code Generation

After editing `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```
This regenerates `lib/api-client-react/src/generated/api.ts` and `api.schemas.ts`.

The `lib/api-client-react/src/index.ts` must only export from `"./generated/api"` and `"./generated/api.schemas"`.

## Platform Colors
- GitHub: `#e6edf3`
- GitLab: `#FC6D26`
- Bitbucket: `#0052CC`
- Slack: `#E01E5A`
- Zoho: `#E42527`

## Key Notes
- No X/Twitter — removed by user request
- Single-user app pattern (fixed profile UUID)
- Platform tokens stored server-side only, never exposed to browser
- Vite config has `dedupe: ["react", "react-dom", "@tanstack/react-query"]` to prevent hook context errors from workspace packages
- `fs.strict: false` in Vite dev server to allow reading from `lib/` workspace packages
