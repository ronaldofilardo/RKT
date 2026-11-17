/**
 * Split de timeline-utils.test.ts — describes "validateEfeito", "validateDirecao"
 * e "validateGolpeEsp" (validação dos campos da cascata). Asserções 1:1.
 */
import { validateEfeito, validateDirecao, validateGolpeEsp } from '../timeline.logic';

describe('validation functions — efeito, direcao e golpe especial', () => {
  describe('validateEfeito', () => {
    it('deve validar efeito valido', () => {
      expect(validateEfeito('topspin').success).toBe(true);
      expect(validateEfeito('slice').success).toBe(true);
      expect(validateEfeito('flat').success).toBe(true);
    });

    it('deve falhar com efeito invalido', () => {
      expect(validateEfeito('invalid').success).toBe(false);
    });
  });

  describe('validateDirecao', () => {
    it('deve validar direcao valida', () => {
      expect(validateDirecao('cruzada').success).toBe(true);
      expect(validateDirecao('paralela').success).toBe(true);
      expect(validateDirecao('centro').success).toBe(true);
      expect(validateDirecao('inside_out').success).toBe(true);
      expect(validateDirecao('inside_in').success).toBe(true);
    });

    it('deve falhar com direcao invalida', () => {
      expect(validateDirecao('invalid').success).toBe(false);
    });
  });

  describe('validateGolpeEsp', () => {
    it('deve validar golpe_esp valido', () => {
      expect(validateGolpeEsp('lob').success).toBe(true);
      expect(validateGolpeEsp('drop_shot').success).toBe(true);
      expect(validateGolpeEsp('bate_pronto').success).toBe(true);
      expect(validateGolpeEsp('swing_volley').success).toBe(true);
    });

    it('deve falhar com golpe_esp invalido', () => {
      expect(validateGolpeEsp('invalid').success).toBe(false);
    });
  });
});
