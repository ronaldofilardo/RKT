import { canReadMatchComments, canWatchMatch } from '../visibility';
import { actor, CT, match, member } from './visibilityCharacterizationTestKit';

describe('visibility.ts (contrato pós-Fase 2)', () => {
  it('canReadMatchComments e canWatchMatch respeitam isolamento estrito', () => {
    expect(canReadMatchComments(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatchComments(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);
    expect(canReadMatchComments(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canWatchMatch(actor({ userId: 'outsider' }), match, false)).toBe(false);
    expect(canWatchMatch(actor({ userId: 'outsider' }), match, true)).toBe(true);
  });
});
