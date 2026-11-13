/**
 * CONTRATO PÓS-FASE 4 — Permissões de ponto, estado e sessões
 *
 * Valida que apenas o anotador dono da anotação (`createdByUserId === currentUserId`)
 * e nunca em cartazes (`isTemplate: true`) pode registrar pontos ou modificar estado.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  matchAnnotationSession: {
    findFirst: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('validateMatchAnnotatorPermission (isolamento estrito pós-Fase 4)', () => {
  const match = {
    player1Id: 'p1',
    player2Id: 'p2',
    player1PartnerId: null,
    player2PartnerId: null,
    createdByUserId: 'creator',
    openForAnnotation: false,
    isTemplate: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('criador dono da anotação pode registrar pontos', async () => {
    const { validateMatchAnnotatorPermission } = await import('@/app/api/matches/[id]/point/point-route-permission.logic');
    await expect(
      validateMatchAnnotatorPermission(match, 'match-1', 'creator', 'ANNOTATOR', undefined, null),
    ).resolves.toBeUndefined();
  });

  it('bloqueia cartazes (isTemplate=true) mesmo para o criador', async () => {
    const { validateMatchAnnotatorPermission } = await import('@/app/api/matches/[id]/point/point-route-permission.logic');
    await expect(
      validateMatchAnnotatorPermission({ ...match, isTemplate: true }, 'match-1', 'creator', 'ANNOTATOR', undefined, null),
    ).rejects.toThrow(/Cartazes não aceitam marcação direta/);
  });

  it('bloqueia ADMIN, atleta participante e terceiros sem autoria (inclusive athletePlayerId=null)', async () => {
    const { validateMatchAnnotatorPermission } = await import('@/app/api/matches/[id]/point/point-route-permission.logic');
    await expect(
      validateMatchAnnotatorPermission(match, 'match-1', 'user-x', 'ADMIN', undefined, null),
    ).rejects.toThrow(/Apenas o anotador dono/);
    await expect(
      validateMatchAnnotatorPermission(match, 'match-1', 'user-x', 'ANNOTATOR', undefined, 'p1'),
    ).rejects.toThrow(/Apenas o anotador dono/);
    await expect(
      validateMatchAnnotatorPermission(match, 'match-1', 'outsider', 'ANNOTATOR', undefined, null),
    ).rejects.toThrow(/Apenas o anotador dono/);
    await expect(
      validateMatchAnnotatorPermission({ ...match, createdByUserId: undefined }, 'match-1', undefined, 'ANNOTATOR', undefined, null),
    ).rejects.toThrow(/Apenas o anotador dono/);
  });
});

describe('checkCanModifyMatchState (isolamento estrito pós-Fase 4)', () => {
  const match = {
    player1Id: 'p1',
    player2Id: 'p2',
    player1PartnerId: null,
    player2PartnerId: null,
    createdByUserId: 'creator',
    openForAnnotation: false,
    isTemplate: false,
  };

  it('apenas o criador dono modifica estado (nunca cartaz, admin, participante ou terceiro)', async () => {
    const { checkCanModifyMatchState } = await import('@/app/api/matches/[id]/state/state-route-guards.logic');
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'creator', role: 'ANNOTATOR' }, null)).resolves.toBe(true);
    await expect(checkCanModifyMatchState({ ...match, isTemplate: true }, 'match-1', { id: 'creator', role: 'ANNOTATOR' }, null)).resolves.toBe(false);
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'staff', role: 'ADMIN' }, null)).resolves.toBe(false);
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'qualquer', role: 'ANNOTATOR' }, null)).resolves.toBe(false);
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'p1-user', role: 'ANNOTATOR' }, 'p1')).resolves.toBe(false);
  });
});
