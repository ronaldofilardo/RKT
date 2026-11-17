import { canDiscoverMatchTemplate } from '../match-event-visibility';
import { actor, tpl } from './matchEventVisibilityCharacterizationTestKit';

describe('canDiscoverMatchTemplate (characterization)', () => {
  it('PUBLIC: qualquer usuário ativo autenticado descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-1' }), tpl({ eventScope: 'PUBLIC' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-2' }), tpl({ eventScope: 'PUBLIC' }))).toBe(true);
  });

  it('PUBLIC: usuário inativo não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-1', isActive: false }), tpl({ eventScope: 'PUBLIC' }))).toBe(false);
  });

  it('PUBLIC: ator nulo não descobre', () => {
    expect(canDiscoverMatchTemplate(null, tpl({ eventScope: 'PUBLIC' }))).toBe(false);
  });
});
