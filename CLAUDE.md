# CLAUDE.md — D4JSP-Build-Planner load-bearing rules

Sibling repo to `D4JSP` (trade core), `D4JSP-Map`, `D4JSP-Admin`. The full project rules live in `C:\Users\Owner\D4JSP\CLAUDE.md` and the deep memory in `agent/memory/d4jsp_session_2026-04-27_learnings.md`. Read those first.

**Stack:** Next.js 14 (pages router) on port 3001 (dev). Build planner is a lazy-loaded module reachable from the trade core. Hosts the Wowhead scraper (`scripts/scrape-wowhead-delta.js`) on KVM 2 — that script is **load-bearing** for the tooltip catalog.

---

## CORE DIRECTIVES (NEVER VIOLATE)

### 1. `start.md` lives at repo root, never moves
Same rule as the other D4JSP repos.

### 2. `CLAUDE.md` (this file) lives at repo root
Don't relocate.

### 3. Push-via-temp-branch — direct `main` push is denied
Same harness rule as trade core. Use `<sha>:deploy/<feature-branch>` form.

### 4. The KVM 2 scraper is fragile — DON'T modify without a one-item test
`scripts/scrape-wowhead-delta.js` (sha `3d694a8`) is the only path that bypasses Wowhead's React-SPA bot block. The combination of:
- Two header sets (`HEADERS` for tooltip endpoints, `XHR_HEADERS` for index pages)
- 8s ± 3s jitter throttle (HARD floor — going faster trips CloudFront)
- Four index URLs that all return the same hydration JSON (~239KB, ~1000 IDs)
- Two ID regexes (`"id":NNNNNN` from React hydration + `/diablo-4/item=NNN` legacy links)
- Idempotent upsert by `wowhead_id`

…is what makes it work. Modifying any of these without a one-item side-by-side test risks losing the running scraper. Backup: `agent-outputs/scraper_kvm2_LANDED_BACKUP.js` (in trade-core repo).

Documented in `docs/integrations/wowhead.md` ("Delta scraper" section).

### 5. Build planner save path
`user_builds` table (Supabase). Migration 047 added `slot_number`, `build_data jsonb`, `is_pinned`. Unique index on `(user_id, slot_number)` for pinned slots; NULL `slot_number` = unlimited named saves. The save endpoint uses anon-client `auth.getUser(token)` for JWT verification (NOT `adminDb`).

---

## DON'T DO LIST

- **Don't restart the running KVM 2 scraper.** It's pm2-managed. `pm2 list` first. Adam: *"the scraper usually runs from kvm2 it was all setup before."*
- **Don't add equipment grid changes that overflow at <768px viewport.** Mobile portrait must vertical-stack or use `vw`-based widths, not fixed `60px` columns.
- **Don't modify the build planner save endpoint to use `adminDb`.** It MUST use the anon client for `auth.getUser(token)` — the `friends/request.js` and `award-xp.js` patterns are canonical.

---

## Drop sources gap (open item)

The current scraper hits `nether.wowhead.com/diablo-4/tooltip/item/<id>` which returns the item card only. Drop-source data (Helltide / Duriel / NMD / Andariel etc.) is rendered on the page-level Wowhead URL, not the tooltip endpoint. Remediation requires a second fetch to `https://www.wowhead.com/diablo-4/item=<id>` with `XHR_HEADERS`, parse hydration JSON for sources/droppedBy, persist to `wowhead_tooltips.drop_sources` (JSONB column added migration 068). See staged diff at `outputs/diffs/fix-c-drop-sources.diff`.

## LoH ingestion (low priority)

`d4_items` (66 rows from 2026-04-17 single seed) doesn't have charms or other LoH expansion item classes. Adam: *"we need to update database with charms and stuff too there is new item classes"*. Confirm full list with Adam at ingestion time. Source from Wowhead's expansion item index (likely `/diablo-4/items/charms` or filtered by season tag), populate `d4_items`, then existing scraper picks up tooltips for those IDs automatically.

---

## Quick reference

- **Project bible:** `C:\Users\Owner\D4JSP\CLAUDE.md`
- **Memory:** `agent/memory/d4jsp_session_2026-04-27_learnings.md`
- **Wowhead scraper doc:** `docs/integrations/wowhead.md`
- **Save endpoint pattern:** `pages/api/save-build.js` (anon client `auth.getUser`)
