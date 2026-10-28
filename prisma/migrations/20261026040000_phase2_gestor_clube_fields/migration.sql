-- Fase 2: Campos de Gestor/Clube e senha provisória
-- Extensão do modelo TrainingCenter com dados de PJ
ALTER TABLE "training_centers" ADD COLUMN "cnpj" TEXT;
ALTER TABLE "training_centers" ADD COLUMN "legalName" TEXT;
ALTER TABLE "training_centers" ADD COLUMN "phone" TEXT;
ALTER TABLE "training_centers" ADD COLUMN "email" TEXT;
ALTER TABLE "training_centers" ADD COLUMN "address" JSON;
ALTER TABLE "training_centers" ADD COLUMN "legalRepName" TEXT;
ALTER TABLE "training_centers" ADD COLUMN "legalRepCpf" TEXT;
ALTER TABLE "training_centers" ADD COLUMN "legalRepEmail" TEXT;
ALTER TABLE "training_centers" ADD COLUMN "legalRepPhone" TEXT;

-- Alterar default de status de ACTIVE para PENDING
ALTER TABLE "training_centers" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Criar índice único para CNPJ (ignora NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "training_centers_cnpj_key" ON "training_centers"("cnpj") WHERE "cnpj" IS NOT NULL;

-- Extensão do modelo User com controle de senha provisória
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "tempPasswordExpiresAt" TIMESTAMP;
