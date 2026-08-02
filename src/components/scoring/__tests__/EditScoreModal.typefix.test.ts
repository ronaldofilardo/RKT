/**
 * Tests for EditScoreModal type safety fix
 * 
 * Fix: Wrapped currentGamePoints with parsePointValue() before passing to toDisplayPoint()
 * Issue: currentGamePoints?.player1/player2 are type string | number
 *        toDisplayPoint() expects only number
 * Solution: Use parsePointValue() to normalize string|number to number
 */

import { parsePointValue, toDisplayPoint } from '@/core/scoring/point-utils';

describe('EditScoreModal - Type Safety Fix', () => {
  describe('toDisplayPoint with string | number inputs', () => {
    it('should convert string "0" to display "0"', () => {
      const input = '0';
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('0');
    });

    it('should convert string "15" to display "15"', () => {
      const input = '15';
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('15');
    });

    it('should convert string "30" to display "30"', () => {
      const input = '30';
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('30');
    });

    it('should convert string "40" to display "40"', () => {
      const input = '40';
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('40');
    });

    it('should convert string "AD" to display "AD"', () => {
      const input = 'AD';
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('AD');
    });

    it('should convert numeric 0 to display "0"', () => {
      const input = 0;
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('0');
    });

    it('should convert numeric 1 (internal index) to display "15"', () => {
      const input = 1;
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('15');
    });

    it('should convert numeric 3 (internal index) to display "40"', () => {
      const input = 3;
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('40');
    });

    it('should convert numeric 4 (internal index) to display "AD"', () => {
      const input = 4;
      const normalized = parsePointValue(input);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('AD');
    });

    it('should handle undefined with fallback to 0', () => {
      const input = undefined;
      const normalized = parsePointValue(input ?? 0);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('0');
    });

    it('should handle null with fallback to 0', () => {
      const input = null;
      const normalized = parsePointValue(input ?? 0);
      const display = toDisplayPoint(normalized);
      expect(display).toBe('0');
    });

    it('should handle mixed string | number union type', () => {
      // Note: parsePointValue treats numeric inputs as internal indices (0-4)
      // and string inputs as display values ("0", "15", "30", "40", "AD")
      const testCases = [
        { input: '0' as string | number, expected: '0' },
        { input: '15' as string | number, expected: '15' },
        { input: '30' as string | number, expected: '30' },
        { input: '40' as string | number, expected: '40' },
        { input: 'AD' as string | number, expected: 'AD' },
        { input: 4 as string | number, expected: 'AD' }, // Internal index 4
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = parsePointValue(input);
        const display = toDisplayPoint(normalized);
        expect(display).toBe(expected);
      });
    });
  });

  describe('EditScoreModal initialization pattern', () => {
    it('should correctly initialize p1Points and p2Points from currentGamePoints', () => {
      // Simulating EditScoreModal useEffect initialization
      const currentGamePoints = {
        player1: '15' as string | number,
        player2: 3 as string | number, // Internal index format
      };

      // Fix: Wrap with parsePointValue to normalize string|number
      const p1Points = toDisplayPoint(parsePointValue(currentGamePoints.player1 ?? 0));
      const p2Points = toDisplayPoint(parsePointValue(currentGamePoints.player2 ?? 0));

      expect(p1Points).toBe('15');
      expect(p2Points).toBe('40'); // Internal 3 → "40"
    });

    it('should handle currentGamePoints with string values from parsePointVal', () => {
      // When currentGamePoints comes from parsePointVal, values are strings like "0", "15", "30", "40", "AD"
      const currentGamePoints = {
        player1: '0',
        player2: '40',
      };

      const p1Points = toDisplayPoint(parsePointValue(currentGamePoints.player1 ?? 0));
      const p2Points = toDisplayPoint(parsePointValue(currentGamePoints.player2 ?? 0));

      expect(p1Points).toBe('0');
      expect(p2Points).toBe('40');
    });

    it('should handle currentGamePoints with numeric internal indices', () => {
      // When currentGamePoints comes from engine state, values are numeric indices 0-4
      const currentGamePoints = {
        player1: 0,
        player2: 3,
      };

      const p1Points = toDisplayPoint(parsePointValue(currentGamePoints.player1 ?? 0));
      const p2Points = toDisplayPoint(parsePointValue(currentGamePoints.player2 ?? 0));

      expect(p1Points).toBe('0');
      expect(p2Points).toBe('40'); // 3 → "40"
    });
  });
});