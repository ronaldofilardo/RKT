-- Migration: 20261126000000_add_asaas_subscriptions_and_invoices
-- Objetivo: Integração com gateway Asaas para cobrança recorrente, faturas e webhooks

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingCycle') THEN
        CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "ct_id" TEXT,
    "plan_tier" TEXT NOT NULL,
    "cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "asaas_customer_id" TEXT,
    "asaas_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_end" TIMESTAMP(3),
    "past_due_since" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "asaas_payment_id" TEXT,
    "value" DECIMAL(10,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billing_type" TEXT,
    "invoice_url" TEXT,
    "bank_slip_url" TEXT,
    "pix_copia_e_cola" TEXT,
    "pix_qrcode_base64" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "asaas_webhook_events" (
    "id" TEXT NOT NULL,
    "asaas_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_asaas_subscription_id_key" ON "subscriptions"("asaas_subscription_id");
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_status_idx" ON "subscriptions"("user_id", "status");
CREATE INDEX IF NOT EXISTS "subscriptions_ct_id_status_idx" ON "subscriptions"("ct_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_asaas_payment_id_key" ON "invoices"("asaas_payment_id");
CREATE INDEX IF NOT EXISTS "invoices_subscription_id_status_idx" ON "invoices"("subscription_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "asaas_webhook_events_asaas_event_id_key" ON "asaas_webhook_events"("asaas_event_id");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_fkey') THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_ct_id_fkey') THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_ct_id_fkey" FOREIGN KEY ("ct_id") REFERENCES "training_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_subscription_id_fkey') THEN
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
