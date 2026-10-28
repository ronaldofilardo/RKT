import { isValidCnpj, formatCnpj } from '../cnpj.validator';
import { isValidCpf, formatCpf } from '../cpf.validator';

describe('isValidCnpj', () => {
  it('aceita CNPJ válido com máscara', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('aceita CNPJ válido sem máscara', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  it('rejeita CNPJ com dígitos verificadores inválidos', () => {
    expect(isValidCnpj('11.222.333/0001-00')).toBe(false);
  });

  it('rejeita CNPJ com todos os dígitos iguais', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
  });

  it('rejeita CNPJ com comprimento incorreto', () => {
    expect(isValidCnpj('11.222.333/0001-8')).toBe(false);
    expect(isValidCnpj('11.222.333/0001-812')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isValidCnpj('')).toBe(false);
  });
});

describe('formatCnpj', () => {
  it('formata CNPJ sem máscara', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('mantém CNPJ já com máscara inalterado', () => {
    expect(formatCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81');
  });

  it('retorna string inválida como está', () => {
    expect(formatCnpj('123')).toBe('123');
  });
});

describe('isValidCpf', () => {
  it('aceita CPF válido com máscara', () => {
    expect(isValidCpf('111.444.777-35')).toBe(true);
  });

  it('aceita CPF válido sem máscara', () => {
    expect(isValidCpf('11144477735')).toBe(true);
  });

  it('rejeita CPF com dígitos verificadores inválidos', () => {
    expect(isValidCpf('111.444.777-00')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com comprimento incorreto', () => {
    expect(isValidCpf('111.444.777-3')).toBe(false);
    expect(isValidCpf('111.444.777-352')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isValidCpf('')).toBe(false);
  });
});

describe('formatCpf', () => {
  it('formata CPF sem máscara', () => {
    expect(formatCpf('11144477735')).toBe('111.444.777-35');
  });

  it('mantém CPF já com máscara inalterado', () => {
    expect(formatCpf('111.444.777-35')).toBe('111.444.777-35');
  });

  it('retorna string inválida como está', () => {
    expect(formatCpf('123')).toBe('123');
  });
});
