import { canReadMatch } from '../visibility';
import { actor, CT, match, member, OTHER_CT } from './visibilityCharacterizationTestKit';

describe('visibility.ts (contrato pós-Fase 2)', () => {
  it('canReadMatch libera criador e gestor do CT dono, e bloqueia vazamentos cruzados', () => {
    expect(canReadMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);

    expect(canReadMatch(actor({ userId: 'annotator' }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('TREINADOR', { ctId: OTHER_CT })] }), match)).toBe(false);
    expect(canReadMatch(actor({ athletePlayerId: 'p-2' }), match)).toBe(false);
    expect(canReadMatch(actor({ guardianOfPlayerIds: ['p-1'] }), match)).toBe(false);
    expect(canReadMatch(actor({ followedPlayerIds: ['p-1'] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })], activeContextId: CT }), match)).toBe(false);
  });
});
