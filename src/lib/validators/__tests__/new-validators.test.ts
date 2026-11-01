import { validateCnpj } from '../cnpj.validator';
import { validateCpf } from '../cpf.validator';
import { validatePhone, isValidPhone, formatPhone } from '../phone.validator';
import { validateEmail, isValidEmail } from '../email.validator';
import { validateCep, isValidCep, formatCep } from '../cep.validator';
import { validateUf, isValidUf } from '../uf.validator';
import { maskCpf, maskCnpj, maskPhone, maskCep, maskUf } from '../masks';

describe('validateCnpj detalhado', () => {
  it('retorna INCOMPLETE quando faltam dígitos', () => {
    const res = validateCnpj('11.222.333/0001');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('INCOMPLETE');
    expect(res.message).toContain('faltam');
  });

  it('retorna INVALID_DV quando dígitos verificadores estão errados', () => {
    const res = validateCnpj('11.222.333/0001-00');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('INVALID_DV');
  });

  it('valida com sucesso CNPJ válido', () => {
    const res = validateCnpj('11.222.333/0001-81');
    expect(res.isValid).toBe(true);
  });
});

describe('validateCpf detalhado', () => {
  it('retorna INCOMPLETE quando faltam dígitos', () => {
    const res = validateCpf('111.444.777');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('INCOMPLETE');
  });

  it('valida com sucesso CPF válido', () => {
    const res = validateCpf('111.444.777-35');
    expect(res.isValid).toBe(true);
  });
});

describe('PhoneValidator', () => {
  it('rejeita telefone vazio', () => {
    expect(validatePhone('').isValid).toBe(false);
  });

  it('rejeita DDD inexistente', () => {
    const res = validatePhone('(00) 99999-9999');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('INVALID_DDD');
  });

  it('valida celular 11 dígitos com 9 inicial', () => {
    expect(isValidPhone('(11) 98765-4321')).toBe(true);
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('rejeita celular sem dígito 9 após DDD', () => {
    const res = validatePhone('(11) 88765-4321');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('INVALID_MOBILE');
  });

  it('valida telefone fixo de 10 dígitos iniciando com 2..5', () => {
    expect(isValidPhone('(11) 3456-7890')).toBe(true);
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
  });

  it('rejeita telefone fixo iniciando com dígito inválido', () => {
    const res = validatePhone('(11) 6456-7890');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('INVALID_LANDLINE');
  });
});

describe('EmailValidator', () => {
  it('valida emails válidos', () => {
    expect(isValidEmail('usuario@dominio.com')).toBe(true);
    expect(isValidEmail('teste.atleta@clube.com.br')).toBe(true);
  });

  it('rejeita email sem @', () => {
    const res = validateEmail('usuariodominio.com');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('MISSING_AT');
  });

  it('rejeita email com espaço', () => {
    const res = validateEmail('usuario @dominio.com');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('CONTAINS_SPACE');
  });

  it('rejeita domínio sem ponto', () => {
    const res = validateEmail('usuario@dominio');
    expect(res.isValid).toBe(false);
    expect(res.code).toBe('DOMAIN_NO_DOT');
  });
});

describe('Cep e Uf Validators', () => {
  it('valida CEP correto', () => {
    expect(isValidCep('01310-100')).toBe(true);
    expect(formatCep('01310100')).toBe('01310-100');
  });

  it('rejeita CEP incompleto', () => {
    expect(validateCep('01310').code).toBe('INCOMPLETE');
  });

  it('valida UF brasileira válida', () => {
    expect(isValidUf('SP')).toBe(true);
    expect(isValidUf('rj')).toBe(true);
    expect(isValidUf('XX')).toBe(false);
  });
});

describe('Masks', () => {
  it('aplica máscaras parciais e completas', () => {
    expect(maskCpf('11144477735')).toBe('111.444.777-35');
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
    expect(maskPhone('1134567890')).toBe('(11) 3456-7890');
    expect(maskCep('01310100')).toBe('01310-100');
    expect(maskUf('sp')).toBe('SP');
  });
});

