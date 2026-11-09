import {
  NICKNAME_MAX,
  NICKNAME_MIN,
  normalizeNickname,
  validateNickname,
} from '../nickname';

describe('nickname', () => {
  it('normaliza com trim e minúsculas', () => {
    expect(normalizeNickname('  Joao.Silva  ')).toBe('joao.silva');
  });

  it('aceita apelidos válidos com letras, números, ponto, hífen e sublinhado', () => {
    expect(validateNickname('joao')).toEqual({ valid: true });
    expect(validateNickname('joao.silva_99')).toEqual({ valid: true });
    expect(validateNickname('atleta-01')).toEqual({ valid: true });
    expect(validateNickname('JOAO')).toEqual({ valid: true });
  });

  it('recusa apelido curto demais', () => {
    expect(validateNickname('ab')).toEqual({ valid: false, reason: 'muito_curto' });
  });

  it('recusa apelido longo demais', () => {
    expect(validateNickname('a'.repeat(NICKNAME_MAX + 1))).toEqual({
      valid: false,
      reason: 'muito_longo',
    });
  });

  it('aceita exatamente os limites mínimo e máximo', () => {
    expect(validateNickname('a'.repeat(NICKNAME_MIN)).valid).toBe(true);
    expect(validateNickname('a'.repeat(NICKNAME_MAX)).valid).toBe(true);
  });

  it('recusa caracteres inválidos (espaço, @, acentos)', () => {
    expect(validateNickname('joao silva')).toEqual({
      valid: false,
      reason: 'caracteres_invalidos',
    });
    expect(validateNickname('@joao')).toEqual({ valid: false, reason: 'caracteres_invalidos' });
    expect(validateNickname('joão')).toEqual({ valid: false, reason: 'caracteres_invalidos' });
  });
});
