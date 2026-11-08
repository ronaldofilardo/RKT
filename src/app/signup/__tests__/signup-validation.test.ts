import {
  formatCpfInput,
  formatIdentifierInput,
  validateFullName,
  validateIdentifier,
  validatePassword,
} from '../signup-validation.logic';

describe('validateFullName', () => {
  it('exige nome e sobrenome', () => {
    expect(validateFullName('')).toBe('Informe seu nome completo');
    expect(validateFullName('Ana')).toBe('Informe nome e sobrenome');
    expect(validateFullName('Ana Souza')).toBeNull();
  });

  it('rejeita números no nome', () => {
    expect(validateFullName('Ana 2 Souza')).toBe('O nome não pode conter números');
  });
});

describe('formatCpfInput', () => {
  it('aplica máscara progressiva', () => {
    expect(formatCpfInput('529')).toBe('529');
    expect(formatCpfInput('5299')).toBe('529.9');
    expect(formatCpfInput('529982')).toBe('529.982');
    expect(formatCpfInput('529982247')).toBe('529.982.247');
    expect(formatCpfInput('52998224725')).toBe('529.982.247-25');
  });

  it('descarta caracteres não numéricos e limita a 11 dígitos', () => {
    expect(formatCpfInput('529.982.247-25')).toBe('529.982.247-25');
    expect(formatCpfInput('529982247259999')).toBe('529.982.247-25');
  });
});

describe('formatIdentifierInput', () => {
  it('preserva e-mail em digitação e mascara apenas números', () => {
    expect(formatIdentifierInput('ana')).toBe('ana');
    expect(formatIdentifierInput('ana@rkt')).toBe('ana@rkt');
    expect(formatIdentifierInput('5299')).toBe('529.9');
  });
});

describe('validateIdentifier', () => {
  it('valida e-mail', () => {
    expect(validateIdentifier('ana@rkt.com')).toBeNull();
    expect(validateIdentifier('ana@')).toBe('Informe um e-mail válido');
    expect(validateIdentifier('ana')).toBe('Informe um e-mail válido');
  });

  it('aponta CPF incompleto e inválido', () => {
    expect(validateIdentifier('529.982.247')).toBe('CPF incompleto (faltam 2 dígitos)');
    expect(validateIdentifier('111.111.111-11')).toBe('CPF inválido. Confira os dígitos digitados.');
  });

  it('aceita CPF com dígitos verificadores válidos', () => {
    expect(validateIdentifier('529.982.247-25')).toBeNull();
  });

  it('exige identificador', () => {
    expect(validateIdentifier('   ')).toBe('Informe seu e-mail ou CPF');
  });
});

describe('validatePassword', () => {
  it('exige no mínimo 8 caracteres', () => {
    expect(validatePassword('1234567')).toBe('A senha deve ter no mínimo 8 caracteres');
    expect(validatePassword('12345678')).toBeNull();
  });
});
