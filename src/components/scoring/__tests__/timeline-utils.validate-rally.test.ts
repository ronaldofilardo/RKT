/**
 * Split de timeline-utils.test.ts — describes "validateRallyDetails" e
 * "isValidRallyDetails" (núcleo de validação do RallyDetails). Asserções 1:1.
 */
import { validateRallyDetails, isValidRallyDetails } from '../timeline.logic';
import { VALID_RALLY_DETAILS } from './timelineUtilsTestKit';

describe('validation functions — RallyDetails', () => {
  describe('validateRallyDetails', () => {
    it('deve validar RallyDetails completo', () => {
      const result = validateRallyDetails({
        ...VALID_RALLY_DETAILS,
        efeito: 'topspin',
        direcao: 'cruzada',
      });
      expect(result.success).toBe(true);
    });

    it('deve aceitar RallyDetails sem campos opcionais', () => {
      const result = validateRallyDetails(VALID_RALLY_DETAILS);
      expect(result.success).toBe(true);
    });

    it('deve falhar com dados inválidos', () => {
      const result = validateRallyDetails({ situacao: 'invalid' });
      expect(result.success).toBe(false);
      const errors = result.success ? {} : result.errors;
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });

    it('deve falhar com tipo invalido', () => {
      const result = validateRallyDetails({ ...VALID_RALLY_DETAILS, tipo: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('deve falhar com golpe invalido', () => {
      const result = validateRallyDetails({ ...VALID_RALLY_DETAILS, golpe: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('isValidRallyDetails', () => {
    it('deve retornar true para dados validos', () => {
      expect(isValidRallyDetails(VALID_RALLY_DETAILS)).toBe(true);
    });

    it('deve retornar false para dados invalidos', () => {
      expect(isValidRallyDetails({})).toBe(false);
      expect(isValidRallyDetails(null)).toBe(false);
      expect(isValidRallyDetails(undefined)).toBe(false);
    });
  });
});
