import { canDiscoverMatchTemplate } from '../match-event-visibility';
import { actor, tpl } from './matchEventVisibilityCharacterizationTestKit';

describe('canDiscoverMatchTemplate (characterization)', () => {
  it('PRIVATE_COACH: criador descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'creator' }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(true);
  });

  it('PRIVATE_COACH: atleta participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-9', athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(true);
  });

  it('PRIVATE_COACH: responsável de menor participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ guardianOfPlayerIds: ['p-1'] }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(true);
  });

  it('PRIVATE_COACH: usuário sem vínculo com participante não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-9' }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(false);
  });
});
