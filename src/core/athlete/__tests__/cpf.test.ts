import { cleanCpf, isValidCpf, getCpfLast2, maskCpf, hashCpf } from '../cpf';

describe('Athlete Core: CPF logic', () => {
  const VALID_CPF = '52998224725';
  const VALID_CPF_FORMATTED = '529.982.247-25';

  it('cleanCpf remove caracteres não numéricos', () => {
    expect(cleanCpf('123.456.789-00')).toBe('12345678900');
    expect(cleanCpf(' 529-982 ')).toBe('529982');
  });

  it('isValidCpf valida CPFs legítimos com mod 11', () => {
    expect(isValidCpf(VALID_CPF)).toBe(true);
    expect(isValidCpf(VALID_CPF_FORMATTED)).toBe(true);
  });

  it('isValidCpf rejeita CPFs com digitos repetidos ou tamanho incorreto', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCpf('1234567890')).toBe(false);
    expect(isValidCpf('123456789012')).toBe(false);
    expect(isValidCpf('52998224726')).toBe(false); // dígito verificador errado
  });

  it('getCpfLast2 extrai os últimos 2 dígitos', () => {
    expect(getCpfLast2(VALID_CPF_FORMATTED)).toBe('25');
  });

  it('maskCpf gera formato seguro preservando contexto mínimo', () => {
    expect(maskCpf(VALID_CPF_FORMATTED)).toBe('***.***.**7-25');
  });

  it('hashCpf gera HMAC determinístico usando pepper', () => {
    const hash1 = hashCpf(VALID_CPF, 'pepper-secret-key');
    const hash2 = hashCpf(VALID_CPF_FORMATTED, 'pepper-secret-key');
    const hash3 = hashCpf(VALID_CPF, 'other-pepper');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(hash3);
  });
});

