-- Migration: 003_extend_user_builds
-- Purpose: Add missing columns to user_builds, add upsert constraint, drop the
--          wrongly-created anon `builds` table from migration 002.
--
-- Run AFTER 002_builds.sql has been applied (even though we're dropping that table here).
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.

-- 1. Add columns the Build Planner needs that weren't in the original schema.
ALTER TABLE user_builds
  ADD COLUMN IF NOT EXISTS slot      INT   NOT NULL DEFAULT 0
                                           CHECK (slot BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS gender    TEXT  NOT NULL DEFAULT 'male'
                                           CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS transmog  JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stats     JSONB NOT NULL DEFAULT '{}';

-- 2. Unique constraint so upsert(onConflict: 'user_id,slot') works correctly.
--    Each user gets up to 5 named slots (0-4).
ALTER TABLE user_builds
  ADD CONSTRAINT IF NOT EXISTS uq_user_builds_user_slot UNIQUE (user_id, slot);

-- 3. Drop the anon-open `builds` table created by migration 002 — it has no
--    real auth and is a duplicate.
DROP TABLE IF EXISTS builds;
