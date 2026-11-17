import { canDiscoverMatchTemplate } from '../match-event-visibility';
import { actor, CT, member, OTHER_CT, tpl } from './matchEventVisibilityCharacterizationTestKit';

describe('canDiscoverMatchTemplate (characterization)', () => {
  it('PRIVATE_CLUB: staff do CT dono descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('GESTOR', { ctId: CT })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: staff de outro CT não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('TREINADOR', { ctId: OTHER_CT })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
  });

  it('PRIVATE_CLUB: atleta participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: responsável de menor participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ guardianOfPlayerIds: ['p-2'] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: treinador particular que acompanha participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ followedPlayerIds: ['p-2'] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: atleta alheio ou treinador sem vínculo não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-9' }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
    expect(canDiscoverMatchTemplate(actor({ followedPlayerIds: ['p-9'] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
  });

  it('PRIVATE_CLUB: staff com vínculo suspenso não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('GESTOR', { ctId: CT, status: 'SUSPENDED' })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
  });
});
