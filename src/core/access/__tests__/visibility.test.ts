import { canReadMatch, canReadMatchComments, type MatchAccess } from '../visibility';
import { CT, OTHER_CT, actor, member } from './fixtures';

const match: MatchAccess = {
  createdByUserId: 'creator',
  ctId: CT,
  annotatorUserIds: ['annotator'],
  participantPlayerIds: ['p-1', 'p-2'],
  participantCtIds: [OTHER_CT],
};

describe('canReadMatch (§6.3)', () => {
  it('criador e anotador da partida leem', () => {
    expect(canReadMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatch(actor({ userId: 'annotator' }), match)).toBe(true);
  });

  it('equipe do CT dono lê (gestor e treinador)', () => {
    expect(canReadMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);
    expect(canReadMatch(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(true);
  });

  it('equipe do CT de um participante lê', () => {
    const a = actor({ memberships: [member('TREINADOR', { ctId: OTHER_CT })] });
    expect(canReadMatch(a, match)).toBe(true);
  });

  it('atleta participante e responsável de menor leem', () => {
    expect(canReadMatch(actor({ athletePlayerId: 'p-2' }), match)).toBe(true);
    expect(canReadMatch(actor({ guardianOfPlayerIds: ['p-1'] }), match)).toBe(true);
  });

  it('nega para outros: treinador avulso, atleta alheio, admin, suporte, inativo', () => {
    expect(canReadMatch(actor({ memberships: [member('TREINADOR')] }), match)).toBe(false);
    expect(canReadMatch(actor({ athletePlayerId: 'p-9' }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'SUPORTE' })] }), match)).toBe(false);
    expect(canReadMatch(actor({ userId: 'creator', isActive: false }), match)).toBe(false);
    expect(canReadMatch(null, match)).toBe(false);
  });

  it('vínculo suspenso não dá acesso', () => {
    const a = actor({ memberships: [member('GESTOR', { ctId: CT, status: 'SUSPENDED' })] });
    expect(canReadMatch(a, match)).toBe(false);
  });

  it('partida sem CT não concede acesso a quem tem vínculo sem CT', () => {
    const noCt: MatchAccess = { ...match, ctId: null };
    expect(canReadMatch(actor({ memberships: [member('TREINADOR')] }), noCt)).toBe(false);
  });
});

describe('canReadMatchComments', () => {
  it('só criador, anotador e equipe do CT dono', () => {
    expect(canReadMatchComments(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatchComments(actor({ userId: 'annotator' }), match)).toBe(true);
    expect(canReadMatchComments(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);
  });

  it('nunca atleta, responsável nem CT de participante', () => {
    expect(canReadMatchComments(actor({ athletePlayerId: 'p-1' }), match)).toBe(false);
    expect(canReadMatchComments(actor({ guardianOfPlayerIds: ['p-1'] }), match)).toBe(false);
    expect(canReadMatchComments(actor({ memberships: [member('GESTOR', { ctId: OTHER_CT })] }), match)).toBe(false);
  });
});
