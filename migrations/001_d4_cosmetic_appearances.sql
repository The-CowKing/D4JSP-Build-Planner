-- Migration: 001_d4_cosmetic_appearances
-- Purpose: Stores gear appearance variants for the transmog system.
--
-- image_path convention: /paperdoll/gear/{class}/{slot}/{appearance_key}.png
-- class = 'all' means the appearance is shared across every class.
-- source values: base_drop | seasonal | shop | challenge | battlepass
--
-- DO NOT RUN until the paperdoll asset pipeline is ready to populate rows.

CREATE TABLE IF NOT EXISTS d4_cosmetic_appearances (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  class          TEXT          NOT NULL,
  slot           TEXT          NOT NULL,
  appearance_key TEXT          NOT NULL,
  display_name   TEXT          NOT NULL,
  source         TEXT          NOT NULL
                               CHECK (source IN ('base_drop', 'seasonal', 'shop', 'challenge', 'battlepass')),
  image_path     TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT uq_appearance UNIQUE (class, slot, appearance_key)
);

-- Fast lookup by class + slot (used by the transmog dropdown)
CREATE INDEX IF NOT EXISTS idx_cosmetic_class_slot
  ON d4_cosmetic_appearances (class, slot);

-- ── Seed: one "Base Appearance" row per slot for the 'all' pseudo-class ──────
-- These serve as the default option in the transmog dropdown before class-
-- specific appearances are imported.

INSERT INTO d4_cosmetic_appearances (class, slot, appearance_key, display_name, source, image_path)
VALUES
  ('all', 'helm',     'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'amulet',   'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'chest',    'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'gloves',   'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'legs',     'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'boots',    'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'mainhand', 'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'offhand',  'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'ring1',    'base', 'Base Appearance', 'base_drop', NULL),
  ('all', 'ring2',    'base', 'Base Appearance', 'base_drop', NULL)
ON CONFLICT (class, slot, appearance_key) DO NOTHING;
