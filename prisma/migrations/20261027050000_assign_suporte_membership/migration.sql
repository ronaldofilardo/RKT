-- Fase 1 (P6): Atribuir membership PLATAFORMA/SUPORTE ao usuário suporte@rkt.com
-- O usuário tem role ANNOTATOR e nenhuma membership, então o sistema não o reconhece como suporte.
-- Inserir usuário faltante para respeitar FK memberships_userId_fkey
INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "isActive", "canOperate", "createdAt", "updatedAt")
VALUES (
  'cmvprb36c0000ybsvjw14ca2u',
  'Suporte RKT',
  'suporte@rkt.com',
  '$2a$10$4ITRaFrA1ifnnJHNoKE9C.VX3RlBDaZmcMQHrwsh3LfcrUwoZJ..a',
  'ANNOTATOR',
  true,
  true,
  now(),
  now()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "memberships" ("id", "userId", "kind", "preset", "ctId", "status", "createdByUserId", "createdAt", "endedAt")
VALUES (
  'cmvprb36c0001ybsvjw14ca2v',
  'cmvprb36c0000ybsvjw14ca2u',
  'PLATAFORMA',
  'SUPORTE',
  NULL,
  'ACTIVE',
  NULL,
  now(),
  NULL
);
