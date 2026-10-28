import { buildActor, type ActorRow } from '@/services/access-actor.logic';

const NOW = new Date('2026-10-25T12:00:00Z');

const base: ActorRow = {
  id: 'u1',
  isActive: true,
  canOperate: true,
  memberships: [{ kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' }],
  athleteProfile: null,
  guardianLinks: [],
  coachAthleteLinks: [],
};

describe('buildActor', () => {
  it('mapeia campos básicos e normaliza nulos', () => {
    const actor = buildActor(base, NOW);
    expect(actor).toEqual({
      userId: 'u1',
      isActive: true,
      canOperate: true,
      memberships: [{ kind: 'GESTOR', preset: null, ctId: 'ct-1', status: 'ACTIVE' }],
      athletePlayerId: null,
      athleteCtIds: [],
      guardianOfPlayerIds: [],
      followedPlayerIds: [],
    });
  });

  it('expõe o atleta ligado à conta e seus CTs via PlayerCT', () => {
    const actor = buildActor(
      { ...base, athleteProfile: { id: 'p-1', playerCts: [{ ctId: 'ct-1' }, { ctId: 'ct-2' }] } },
      NOW,
    );
    expect(actor.athletePlayerId).toBe('p-1');
    expect(actor.athleteCtIds).toEqual(['ct-1', 'ct-2']);
  });

  it('athleteCtIds vazio quando athleteProfile nulo', () => {
    expect(buildActor(base, NOW).athleteCtIds).toEqual([]);
  });

  it('responsável só de menores com vínculo confirmado e não revogado', () => {
    const confirmed = new Date('2026-01-01T00:00:00Z');
    const row: ActorRow = {
      ...base,
      guardianLinks: [
        { confirmedAt: confirmed, revokedAt: null, player: { id: 'minor', birthDate: new Date('2015-01-01') } },
        { confirmedAt: confirmed, revokedAt: null, player: { id: 'adult', birthDate: new Date('1990-01-01') } },
        { confirmedAt: null, revokedAt: null, player: { id: 'pending', birthDate: new Date('2015-01-01') } },
        { confirmedAt: confirmed, revokedAt: confirmed, player: { id: 'revoked', birthDate: new Date('2015-01-01') } },
      ],
    };
    expect(buildActor(row, NOW).guardianOfPlayerIds).toEqual(['minor']);
  });
});
