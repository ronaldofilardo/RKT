-- Adiciona canInsertAthletes ao Membership para controle de permissão de cadastro de atletas por treinador
ALTER TABLE "memberships" ADD COLUMN "canInsertAthletes" BOOLEAN NOT NULL DEFAULT true;
