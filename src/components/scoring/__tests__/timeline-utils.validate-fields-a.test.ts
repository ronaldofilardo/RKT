/**
 * Split de timeline-utils.test.ts — describes "validateSituacao", "validateTipo"
 * e "validateGolpe" (validação dos campos básicos). Asserções 1:1.
 */
import { validateSituacao, validateTipo, validateGolpe } from '../timeline.logic';

describe('validation functions — situacao, tipo e golpe', () => {
  describe('validateSituacao', () => {
    it('deve validar situacao valida', () => {
      expect(validateSituacao('fundo').success).toBe(true);
      expect(validateSituacao('rede').success).toBe(true);
      expect(validateSituacao('passada').success).toBe(true);
      expect(validateSituacao('devolucao').success).toBe(true);
    });

    it('deve falhar com situacao invalida', () => {
      const result = validateSituacao('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('validateTipo', () => {
    it('deve validar tipo valido', () => {
      expect(validateTipo('winner').success).toBe(true);
      expect(validateTipo('erro_forcado').success).toBe(true);
      expect(validateTipo('erro_nao_forcado').success).toBe(true);
      expect(validateTipo('dupla_falta').success).toBe(true);
    });

    it('deve falhar com tipo invalido', () => {
      expect(validateTipo('invalid').success).toBe(false);
    });
  });

  describe('validateGolpe', () => {
    it('deve validar golpe valido', () => {
      expect(validateGolpe('fh').success).toBe(true);
      expect(validateGolpe('bh').success).toBe(true);
      expect(validateGolpe('vfh').success).toBe(true);
      expect(validateGolpe('vbh').success).toBe(true);
      expect(validateGolpe('smash').success).toBe(true);
      expect(validateGolpe('approach_fh').success).toBe(true);
      expect(validateGolpe('approach_bh').success).toBe(true);
    });

    it('deve falhar com golpe invalido', () => {
      expect(validateGolpe('invalid').success).toBe(false);
    });
  });
});
