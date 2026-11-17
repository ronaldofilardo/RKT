import { canDiscoverMatchTemplate } from '../match-event-visibility';
import { actor, tpl } from './matchEventVisibilityCharacterizationTestKit';

describe('canDiscoverMatchTemplate (characterization)', () => {
  it('PRIVATE_PERSONAL: apenas o próprio criador descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'creator' }), tpl({ eventScope: 'PRIVATE_PERSONAL' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-2' }), tpl({ eventScope: 'PRIVATE_PERSONAL' }))).toBe(false);
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_PERSONAL' }))).toBe(false);
  });

  it('PRIVATE_PERSONAL: sem criador, nenhum usuário descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-2' }), tpl({ eventScope: 'PRIVATE_PERSONAL', createdByUserId: null }))).toBe(false);
  });
});
