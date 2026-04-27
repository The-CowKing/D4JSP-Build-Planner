# D4JSP-Build-Planner — Integrations

> Repo-specific integrations. For the cross-app picture (Stripe, Resend, web-push, etc), see the main `D4JSP` repo's [`./integrations/`](../../D4JSP/docs/integrations/) tree.

## Wowhead

The build planner ITEM SLOTS source tooltip data from `wowhead_tooltips` (cache table in the main DB). Tooltip rendering uses cached `tooltip_html`.

**Scrape strategy:**
- **Per-item endpoint works:** `wowhead.com/d4/items/<slug>` returns the structured tooltip page; parser pulls stats / rarity / icon.
- **Index pages blocked:** bulk scraping via the items list returns rate-limit responses or 403s.
- **Scraper v2 queued:** per-item + sitemap discovery for new D4 patches. Currently the catalog relies on (a) admin manual entry, (b) the OCR auto-absorb fallback gate, (c) earlier scraper passes.

## OCR cluster (KVM 2)

Used by the main app's sell pipeline, not directly by the builder. But the catalog the builder reads is populated partly by OCR auto-absorb when the gate is ON.

- **Service:** RapidOCR via systemd `d4jsp-ocr.service`, uvicorn 3 workers.
- **Internal port:** 8000. **Public via nginx:** 9000. Misconfig regression history: post-cloud-to-KVM migration had it pointing 9000 → 9000 (dead). Fixed to 9000 → 8000.
- **Endpoint:** `POST /api/ocr/identify` on the main app proxies to the OCR cluster.

## OCR auto-absorb fallback

**Knob:** `system_config.ai.auto_absorb_unknown_items` (default `false`).

When ON during D4 patch windows: OCR auto-absorbs unknown items into `wowhead_tooltips` with `source='user_submitted'`, `reviewed=false`. Gates:
- Tooltip parses cleanly to D4 stat structure.
- Rarity is Unique / Legendary / Ancestral.
- User has `email_confirmed_at IS NOT NULL` AND (`positive_reviews >= 3` OR `rank_level >= 10`).

Admin reviews + approves in `/admin-panel → AI Identifications`. Default OFF prevents catalog pollution.

The builder reads `wowhead_tooltips WHERE reviewed=true` for the canonical catalog. When auto-absorb is ON during a patch window, the builder may show recently-approved items immediately after admin review.

## Supabase (cross-domain SSO)

`D4JSP-Build-Planner/lib/supabase.js` uses the same `.d4jsp.org` chunked cookie storage as the main repo (added #117). Login on any subdomain propagates here. The builder is auth-aware (Save / Load are gated on session) but doesn't have its own auth flow — pure SSO consumer.

## D4Armory (boss timer)

Used by the main app's Profile → Map tab via `D4JSP-Map`. Builder doesn't consume directly. Boss rotation data lives in `boss_rotations` (main DB, migration 048).

## Cross-references

- Main repo:
  - [`./integrations/wowhead.md`](../../D4JSP/docs/integrations/wowhead.md) — fuller wowhead doc
  - [`./endpoints/ocr.md`](../../D4JSP/docs/endpoints/ocr.md) — OCR endpoints
  - [`./catalogs/system-config.md`](../../D4JSP/docs/catalogs/system-config.md) — `auto_absorb_unknown_items` knob
  - [`./features/build-planner.md`](../../D4JSP/docs/features/build-planner.md) — build planner integration with main app
  - [`./features/builder-saves.md`](../../D4JSP/docs/features/builder-saves.md) — Save / Load flow (#117)
- This repo:
  - [`./conventions.md`](./conventions.md) — wowhead + OCR + tooltip cache flow
