# D4JSP-Build-Planner

Diablo 4 build planner — damage calc + paper-doll. Mounted inside the trade site at `https://trade.d4jsp.org/builder/*` via static export with `basePath: '/builder'`.

**Read [`start.md`](./start.md) first.** Everything else is reachable from there.

This repo has zero of its own API routes. Build saves go to the D4JSP backend via `POST /api/save-build`. Tier gating is read from the shared `admin_permissions.d4_build_slots` catalog.

## See also

- [`start.md`](./start.md) — single front door
- [`docs/`](./docs/) — full wiki (identical structure to D4JSP)
- [`docs/features/build-planner.md`](./docs/features/build-planner.md) — this app's role in the trade system
- [`migrations/002_build_planner_permissions.sql`](./migrations/002_build_planner_permissions.sql) — canonical example of the catalog protocol
