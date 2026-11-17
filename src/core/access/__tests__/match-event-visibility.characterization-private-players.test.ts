import { canDiscoverMatchTemplate } from '../match-event-visibility';
import { actor, tpl } from './matchEventVisibilityCharacterizationTestKit';

describe('canDiscoverMatchTemplate (characterization)', () => {
  it('PRIVATE_PLAYERS: apenas atletas diretamente envolvidos (+ responsáveis de menores)', () => {
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ guardianOfPlayerIds: ['p-2'] }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-9' }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(false);
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-9' }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(false);
  });
});
