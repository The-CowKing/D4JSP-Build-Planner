-- Migration: 002_builds
-- Purpose: Stores character build slots for the Build Planner.
--
-- No user auth in this app — RLS allows the anon key to read/write freely.
-- Tighten with a user_id FK once auth is added.
--
-- slot: 0-4 (five character slots per the UI)
-- equipment / transmog / stats: JSONB blobs from component state
-- onConflict: 'slot' drives upsert behaviour in BuildPlanner.js

CREATE TABLE IF NOT EXISTS builds (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slot        INT          NOT NULL UNIQUE CHECK (slot BETWEEN 0 AND 4),
  name        TEXT         NOT NULL DEFAULT 'Character',
  class       TEXT         NOT NULL DEFAULT 'barbarian',
  gender      TEXT         NOT NULL DEFAULT 'male'
                           CHECK (gender IN ('male', 'female')),
  equipment   JSONB        NOT NULL DEFAULT '{}',
  transmog    JSONB        NOT NULL DEFAULT '{}',
  stats       JSONB        NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Allow the anon key (used by the browser client) to read and write.
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY builds_anon_all ON builds
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
