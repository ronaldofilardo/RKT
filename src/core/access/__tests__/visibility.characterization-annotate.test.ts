import { canAnnotateMatch } from '../visibility';
import { actor, CT, match, member } from './visibilityCharacterizationTestKit';

describe('visibility.ts (contrato pós-Fase 2)', () => {
  it('canAnnotateMatch libera exclusivamente o criador dono no contexto válido', () => {
    expect(canAnnotateMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canAnnotateMatch(actor({ userId: 'creator', activeContextId: 'PARTICULAR' }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ athletePlayerId: 'p-1' }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }), match)).toBe(false);
  });
});
