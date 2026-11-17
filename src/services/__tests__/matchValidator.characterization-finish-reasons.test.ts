import { describe, it, expect } from '@jest/globals';
import { validateFinishMatch } from '../matchValidator';
import { matchWith } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('validateFinishMatch', () => {
    it('deve retornar válido para reason=ABANDONED sem scoreState', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const });
      const result = validateFinishMatch(match, undefined, 'ABANDONED');

      expect(result.valid).toBe(true);
    });

    it('deve retornar válido para reason=WALKOVER sem scoreState', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const });
      const result = validateFinishMatch(match, undefined, 'WALKOVER');

      expect(result.valid).toBe(true);
    });

    it('deve retornar válido para reason=INJURY sem scoreState', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const });
      const result = validateFinishMatch(match, undefined, 'INJURY');

      expect(result.valid).toBe(true);
    });

    it('deve retornar válido para reason=OUTRO sem scoreState', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const });
      const result = validateFinishMatch(match, undefined, 'OUTRO');

      expect(result.valid).toBe(true);
    });

    it('deve retornar erro CANNOT_FINISH sem scoreState e sem reason especial', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const });
      const result = validateFinishMatch(match, undefined, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('CANNOT_FINISH');
    });
  });
});
