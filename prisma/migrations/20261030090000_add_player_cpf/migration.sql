-- CPF completo de atleta sem conta (exibição ao gestor do clube)
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
