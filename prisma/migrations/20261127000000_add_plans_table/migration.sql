-- Migration: 20261127000000_add_plans_table
-- Objetivo: Tabela de catálogo e parametrização dinâmica de planos do sistema

CREATE TABLE IF NOT EXISTS "plans" (
    "id" TEXT NOT NULL,
    "tier_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "yearly_price" DECIMAL(10,2) NOT NULL,
    "quota_athletes" INTEGER,
    "quota_coaches" INTEGER,
    "quota_matches" INTEGER,
    "extra_athlete_price" DECIMAL(10,2),
    "extra_coach_price" DECIMAL(10,2),
    "tooltip" TEXT NOT NULL DEFAULT '',
    "features" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "plans_tier_code_key" ON "plans"("tier_code");
