import {
  canReadMatch,
  canAnnotateMatch,
  canReadMatchComments,
  canWatchMatch,
  type MatchAccess,
} from '../visibility';
import { CT, OTHER_CT, actor, member } from './fixtures';

const match: MatchAccess = {
  createdByUserId: 'creator',
  ctId: CT,
  isTemplate: false,
  isOfficialClubAnnotation: false,
  annotatorUserIds: ['annotator'],
  participantPlayerIds: ['p-1', 'p-2'],
  participantCtIds: [OTHER_CT],
};

describe('canReadMatch (isolamento estrito por anotador)', () => {
  it('apenas o criador (dono) e o gestor ativo do CT dono leem a anotação', () => {
    expect(canReadMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);
  });

  it('bloqueia leitura cruzada de outros anotadores, treinadores do mesmo CT, atletas, responsáveis e seguidos', () => {
    expect(canReadMatch(actor({ userId: 'annotator' }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('TREINADOR', { ctId: OTHER_CT })] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('GESTOR', { ctId: OTHER_CT })] }), match)).toBe(false);
    expect(canReadMatch(actor({ athletePlayerId: 'p-1' }), match)).toBe(false);
    expect(canReadMatch(actor({ athletePlayerId: 'p-2' }), match)).toBe(false);
    expect(canReadMatch(actor({ guardianOfPlayerIds: ['p-1'] }), match)).toBe(false);
    expect(canReadMatch(actor({ followedPlayerIds: ['p-1'] }), match)).toBe(false);
  });

  it('gancho futuro: atleta participante lê anotação oficial apenas quando allowParticipantOfficialRead=true', () => {
    const officialMatch: MatchAccess = { ...match, isOfficialClubAnnotation: true };
    expect(canReadMatch(actor({ athletePlayerId: 'p-1' }), officialMatch)).toBe(false);
    expect(
      canReadMatch(actor({ athletePlayerId: 'p-1' }), officialMatch, {
        allowParticipantOfficialRead: true,
      }),
    ).toBe(true);
    expect(
      canReadMatch(actor({ athletePlayerId: 'p-9' }), officialMatch, {
        allowParticipantOfficialRead: true,
      }),
    ).toBe(false);
  });

  it('nunca permite leitura de cartaz (isTemplate=true) como anotação', () => {
    const tpl: MatchAccess = { ...match, isTemplate: true };
    expect(canReadMatch(actor({ userId: 'creator' }), tpl)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), tpl)).toBe(false);
  });

  it('nega para admin, suporte, vínculo suspenso, inativo e nulo', () => {
    expect(canReadMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'SUPORTE' })] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('GESTOR', { ctId: CT, status: 'SUSPENDED' })] }), match)).toBe(false);
    expect(canReadMatch(actor({ userId: 'creator', isActive: false }), match)).toBe(false);
    expect(canReadMatch(null, match)).toBe(false);
  });
});

describe('canAnnotateMatch (isolamento estrito)', () => {
  it('somente o criador dono pode anotar (nunca outro treinador, gestor, atleta ou admin)', () => {
    expect(canAnnotateMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canAnnotateMatch(actor({ userId: 'annotator' }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ athletePlayerId: 'p-1' }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }), match)).toBe(false);
  });

  it('nunca permite anotar em cartaz (isTemplate=true)', () => {
    expect(canAnnotateMatch(actor({ userId: 'creator' }), { ...match, isTemplate: true })).toBe(false);
  });
});

describe('canReadMatchComments', () => {
  it('só dono da anotação e gestor ativo do CT dono', () => {
    expect(canReadMatchComments(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatchComments(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);
    expect(canReadMatchComments(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canReadMatchComments(actor({ userId: 'annotator' }), match)).toBe(false);
    expect(canReadMatchComments(actor({ athletePlayerId: 'p-1' }), match)).toBe(false);
    expect(canReadMatchComments(actor({ guardianOfPlayerIds: ['p-1'] }), match)).toBe(false);
  });
});

describe('canWatchMatch', () => {
  it('concede a quem já tem canReadMatch ou possui convite explícito de espectador', () => {
    expect(canWatchMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canWatchMatch(actor({ athletePlayerId: 'p-1' }), match, false)).toBe(false);
    expect(canWatchMatch(actor({ userId: 'outsider-father' }), match, false)).toBe(false);
    expect(canWatchMatch(actor({ userId: 'outsider-father' }), match, true)).toBe(true);
  });

  it('nega para usuário inativo ou cartaz mesmo com concessão', () => {
    expect(canWatchMatch(actor({ userId: 'outsider-father', isActive: false }), match, true)).toBe(false);
    expect(canWatchMatch(actor({ userId: 'creator' }), { ...match, isTemplate: true }, true)).toBe(false);
  });
});
