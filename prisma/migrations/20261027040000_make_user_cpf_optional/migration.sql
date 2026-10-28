-- Fase 1 (P6): Tornar User.cpf opcional para não gravar e-mail nessa coluna
ALTER TABLE "users" ALTER COLUMN "cpf" DROP NOT NULL;
