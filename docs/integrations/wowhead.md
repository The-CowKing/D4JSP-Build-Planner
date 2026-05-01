# Integrations: Wowhead (item tooltips)

D4 item names + tooltip HTML come from Wowhead via DOM scrape on KVM 2 (Puppeteer).

## Touchpoints

- KVM 2 service `/opt/d4jsp-tooltip` (PM2 `d4jsp-tooltip`, port 3100) — Puppeteer worker.
- `POST /api/tooltip-snapshot` ([`../../pages/api/tooltip-snapshot.js`](../../pages/api/tooltip-snapshot.js)) — proxies to KVM 2.
- [`../../lib/tooltips.js`](../../lib/tooltips.js) — server-side fetch helper.
- [`../../lib/wowhead.js`](../../lib/wowhead.js) — Wowhead URL/slug helpers.
- `wowhead_tooltips` table — cache of scraped HTML by item name + wowhead_id.

## Pipeline

1. Trade app needs a tooltip → `POST /api/tooltip-snapshot { wowheadUrl }`.
2. KVM 2 Puppeteer navigates Wowhead, waits for `document.fonts.ready`, screenshots the tooltip frame.
3. Returns PNG, uploaded to `tooltip-snapshots` Storage bucket.
4. HTML form cached in `wowhead_tooltips.tooltip_html`.

## Gotchas

- Don't block `font` resource in Puppeteer — fonts must load for proper rendering.
- `await document.fonts.ready` before screenshot; otherwise text renders in fallback fonts.
- D4 item slugs are inconsistent — lookup table at `data/item-slugs.json`.

## Delta scraper (the working KVM 2 module — DO NOT BREAK)

**Status (2026-04-28):** ALIVE on KVM 2. +410 new tooltips landed today, total 3,525, queue empty. The SPA-penetrating + anti-bot config below is the *only* working path post-Wowhead's React migration. Backup of the exact landed module: `outputs/scraper_kvm2_LANDED_BACKUP.js` (source SHA `3d694a8`, file: `D4JSP/scripts/scrape-wowhead-delta.js`).

### What broke and how this fixes it

Wowhead migrated to a fully client-rendered React SPA in 2026-04. Static HTML on the index pages no longer contains item IDs — they're loaded into the React hydration JSON delivered when the request looks like a same-origin XHR. Plain `fetch()` with a friendly UA was 500'd by the CloudFront bot block.

This scraper uses **two header sets** to dodge each block path:

```js
// Tooltip-fetch headers — looks like a browser navigating to the page
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Referer': 'https://www.wowhead.com/diablo-4',
};

// Index-page headers — looks like an XHR fired from same-origin React code.
// This header set returns the full ~1000-item hydration JSON payload (~239 KB).
const XHR_HEADERS = {
  'User-Agent': /* same Chrome UA */,
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Referer': 'https://www.wowhead.com/diablo-4',
};
```

### URLs

- **Index (XHR_HEADERS)** — multiple SKU lists, all return the same hydration payload, so one good response is enough:
  - `https://www.wowhead.com/diablo-4/items/uniques`
  - `https://www.wowhead.com/diablo-4/items/mythic`
  - `https://www.wowhead.com/diablo-4/items/legendary`
  - `https://www.wowhead.com/diablo-4/items`
- **Tooltip (HEADERS)** — `https://nether.wowhead.com/diablo-4/tooltip/item/<id>` returns JSON with `tooltip` (HTML), `name`, `icon_url`, `rarity`, etc.

### ID extraction

Both regexes are required for resilience:

```js
const reJson = /"id":(\d{5,8})/g;        // React hydration JSON shape
const reLink = /\/diablo-4\/item=(\d+)\b/g; // legacy link shape
```

### Throttle (HARD floor — never increase rate)

| Stage | Delay |
|---|---|
| Between tooltip fetches | 8000 ms ± 3000 ms jitter |
| Between index pages | 15000 ms ± 3000 ms jitter |

Adam: "we got heavy throttle". Wowhead's 429/503 behavior is aggressive on patterns; the jitter widens the timing distribution so it doesn't look mechanical. **Do NOT lower these floors.** If you need fewer fetches per run, narrow the discovery scope; don't speed up.

### Backoff / failure handling

There is no explicit 429/503 backoff in the current module — it logs and moves on (the long base delay + jitter is the throttle of last resort). If a future run starts seeing a wall of 429s, add: on a `429` or `503` response, sleep `60_000 + jitter(60_000)` and retry once before logging fail.

### Idempotency

Upserts on `wowhead_tooltips.wowhead_id` UNIQUE. Re-runs only fetch genuinely new IDs (delta against existing rows). Safe to relaunch.

### Tradeable detection

Scans tooltip HTML for any of: `Account Bound`, `Bind on Pickup`, `Bind to Account`, `Untradeable`, `Non-Tradeable`, `Cannot be traded`. If matched → `is_tradeable=false`. Default true.

### How to launch (KVM 2)

```bash
ssh kvm2     # key in ~/Desktop/keyz
cd /opt/d4jsp-tooltip   # or wherever the repo is checked out on KVM 2
git pull
nohup node scripts/scrape-wowhead-delta.js > /var/log/d4jsp-scrape.log 2>&1 &
disown
tail -f /var/log/d4jsp-scrape.log
```

### How to monitor

- `pm2 list` — find the scraper process if launched under pm2.
- `tail -f /var/log/d4jsp-scrape.log` — see live progress.
- Supabase: `SELECT COUNT(*), MAX(created_at) FROM wowhead_tooltips;` — should show recent rows landing.
- Supabase: `SELECT COUNT(*) FROM missing_tooltips;` — feedback queue from runtime tooltip-resolver.

### Known gaps

- **Drop sources are NOT being captured.** Verified 2026-04-28 by querying `wowhead_tooltips` for the 410 rows landed today: only 5 mention any drop-related keyword (`drop`/`helltide`/`duriel`/`andariel`), 0 have the canonical `whtt-extra` / `drop-source` CSS class, average HTML size is 942 chars — far too small for the full item-page markup that includes the drop-source list (4–8 KB typical). The current `nether.wowhead.com/diablo-4/tooltip/item/<id>` endpoint returns the item card only, not the page-level drop-source block. **2-line next-bot fix:** add a second fetch per item to `https://www.wowhead.com/diablo-4/item=<id>` with `XHR_HEADERS`; extract the React-hydration drop-source array (look for `"sources":[…]`, `"droppedBy":[…]`, or the `<div class="ttsmark">…` block in the legacy HTML); persist into a new `wowhead_tooltips.drop_sources` JSONB column or a sibling `wowhead_drop_sources` table keyed by `wowhead_id`. Then update the embed renderer (`lib/tooltips.js`) to inject a "DROP SOURCES" line below the description. Do NOT modify the running scraper without a side-by-side test on one item first.
- **`d4_items` table is not refreshed.** 66 rows, latest from 2026-04-17. The scraper only pulls tooltips for items already discovered via the Wowhead index — it doesn't seed the `d4_items` catalog. For items that *are* in `d4_items` but missing tooltips, this works. For *new* expansion items not yet in `d4_items`, this won't pick them up. Building a `d4_items` ingestion path is open work for next bot — do NOT freelance an `d4_items` insert from this scraper without a separate spec from Adam.
- **No 429/503 backoff.** See above. Add only if needed.
- **Index URL hardcoded to 4 list pages.** New rarities (e.g. expansion mythics) may need additional URLs added. All four listed currently respond with the same hydration JSON, so adding more isn't required for completeness today.

## Related

- [`../features/sell-pipeline.md`](../features/sell-pipeline.md) — OCR resolves to a wowhead_id which drives tooltip lookup
- [`../endpoints/ocr.md`](../endpoints/ocr.md) — `/api/tooltip-snapshot`, `/api/fetch-item-template`
- [`../infra/kvm-2.md`](../infra/kvm-2.md)
- `outputs/scraper_kvm2_LANDED_BACKUP.js` — verbatim copy of the working module (preserved 2026-04-28).
