-- Migration: 002_build_planner_permissions
-- Adds Build Planner permissions to the shared admin_permissions catalog and
-- wires them into each subscription tier.
--
-- Pattern: catalog row in admin_permissions → value in subscription_tiers.permissions JSON
--
-- Permissions added:
--   d4_build_slots        — max saved build slots (gates Builder + Map features)
--   d4_build_notify_trade — opt-in trade notifications for equipped items
--   d4_map_access         — access to boss-farming waypoint map (same gate as builds)
--
-- Tier mapping (free → verified → basic → premium → legendary):
--   d4_build_slots:        1 → 1 → 2 → 3 → 5
--   d4_build_notify_trade: — → — → 1 → 1 → 1
--   d4_map_access:         — → — → 1 → 1 → 1

-- ── 1. Catalog entries ────────────────────────────────────────────────────────

INSERT INTO admin_permissions (
  id, name, description,
  group_id, group_label, group_color,
  has_value, value_label,
  defaults, sort_order
)
VALUES
  (
    'd4_build_slots',
    'D4 Build Slots',
    'Number of saved Build Planner slots. Also gates access to the D4 boss-farming map.',
    'd4_builder', 'D4 Build Planner', '#bf642f',
    true, 'slots',
    '{"free":"1","verified":"1","basic":"2","premium":"3","legendary":"5"}',
    100
  ),
  (
    'd4_build_notify_trade',
    'D4 Build Trade Notifications',
    'Notify user when items from a saved build appear in trade listings (push + email).',
    'd4_builder', 'D4 Build Planner', '#bf642f',
    false, NULL,
    '{"free":"—","verified":"—","basic":"1","premium":"1","legendary":"1"}',
    101
  ),
  (
    'd4_map_access',
    'D4 Boss Map Access',
    'Access to the D4 boss-farming waypoint map. Unlocked alongside build saving.',
    'd4_builder', 'D4 Build Planner', '#bf642f',
    false, NULL,
    '{"free":"—","verified":"—","basic":"1","premium":"1","legendary":"1"}',
    102
  )
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  group_id    = EXCLUDED.group_id,
  group_label = EXCLUDED.group_label,
  group_color = EXCLUDED.group_color,
  has_value   = EXCLUDED.has_value,
  value_label = EXCLUDED.value_label,
  defaults    = EXCLUDED.defaults,
  sort_order  = EXCLUDED.sort_order;

-- ── 2. Wire into subscription tiers ──────────────────────────────────────────
-- Merges into existing permissions JSONB without clobbering other permissions.

UPDATE subscription_tiers
SET permissions = permissions || '{"d4_build_slots":"1"}'::jsonb
WHERE id = 'free';

UPDATE subscription_tiers
SET permissions = permissions || '{"d4_build_slots":"1"}'::jsonb
WHERE id = 'verified';

UPDATE subscription_tiers
SET permissions = permissions
  || '{"d4_build_slots":"2","d4_build_notify_trade":"1","d4_map_access":"1"}'::jsonb
WHERE id = 'basic';

UPDATE subscription_tiers
SET permissions = permissions
  || '{"d4_build_slots":"3","d4_build_notify_trade":"1","d4_map_access":"1"}'::jsonb
WHERE id = 'premium';

UPDATE subscription_tiers
SET permissions = permissions
  || '{"d4_build_slots":"5","d4_build_notify_trade":"1","d4_map_access":"1"}'::jsonb
WHERE id = 'legendary';

-- ── 3. Build notification preferences (persists per user per build slot) ──────
-- Extends the existing builds table rather than creating a separate table.

ALTER TABLE builds
  ADD COLUMN IF NOT EXISTS notify_trade  BOOL NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_push   BOOL NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_email  BOOL NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_id       TEXT;

CREATE INDEX IF NOT EXISTS idx_builds_user_notify
  ON builds (user_id, notify_trade)
  WHERE notify_trade = true;
