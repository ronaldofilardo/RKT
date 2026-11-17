jest.mock('@/lib/prisma', () => mockPrismaModule());

import { describe, it, expect } from '@jest/globals';
import { baseMatch, mockPrismaModule } from './pointPermissionsCharacterizationTestKit';

describe('checkCanModifyMatchState (isolamento estrito pós-Fase 4)', () => {
  const match = baseMatch;

  it('apenas o criador dono modifica estado (nunca cartaz, admin, participante ou terceiro)', async () => {
    const { checkCanModifyMatchState } = await import('@/app/api/matches/[id]/state/state-route-guards.logic');
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'creator', role: 'ANNOTATOR' }, null)).resolves.toBe(true);
    await expect(checkCanModifyMatchState({ ...match, isTemplate: true }, 'match-1', { id: 'creator', role: 'ANNOTATOR' }, null)).resolves.toBe(false);
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'staff', role: 'ADMIN' }, null)).resolves.toBe(false);
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'qualquer', role: 'ANNOTATOR' }, null)).resolves.toBe(false);
    await expect(checkCanModifyMatchState(match, 'match-1', { id: 'p1-user', role: 'ANNOTATOR' }, 'p1')).resolves.toBe(false);
  });
});
