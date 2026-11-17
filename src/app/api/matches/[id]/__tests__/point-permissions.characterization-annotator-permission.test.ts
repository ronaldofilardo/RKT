jest.mock('@/lib/prisma', () => mockPrismaModule());

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { baseMatch, mockPrismaModule } from './pointPermissionsCharacterizationTestKit';

describe('validateMatchAnnotatorPermission (isolamento estrito pós-Fase 4)', () => {
  const match = baseMatch;

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
