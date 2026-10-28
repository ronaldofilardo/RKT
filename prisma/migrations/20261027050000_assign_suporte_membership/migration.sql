-- Fase 1 (P6): Atribuir membership PLATAFORMA/SUPORTE ao usuário suporte@rkt.com
-- O usuário tem role ANNOTATOR e nenhuma membership, então o sistema não o reconhece como suporte.
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
