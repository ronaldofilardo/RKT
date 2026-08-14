-- Ensure the MatchFormat enum matches schema.prisma in BOTH environments.
--
-- History: the migration 20260711_remove_best_of_3_no_ad dropped BEST_OF_3_NO_AD
-- from the database enum, but application code (scoring engine, matchConfig,
-- validation contracts, UI) and schema.prisma still reference it. This corrective
-- migration restores it so the database matches the code/schema of truth.
--
-- Additionally, PRO_SET_8 is present in schema.prisma / dev but was missing on
-- some databases (e.g. production built from an earlier init). It is added here
-- for parity.
--
-- Both statements use IF NOT EXISTS so this migration is safe to (re)apply on any
-- environment regardless of its current enum state (PostgreSQL 12+).
--
-- NOTE: ALTER TYPE ... ADD VALUE is allowed inside a transaction block on
-- PostgreSQL 12+, so Prisma's transactional migration wrapper is fine here.

ALTER TYPE "MatchFormat" ADD VALUE IF NOT EXISTS 'BEST_OF_3_NO_AD';
ALTER TYPE "MatchFormat" ADD VALUE IF NOT EXISTS 'PRO_SET_8';
