import { sanitizeNextRedirect } from '../safe-redirect.logic';

describe('sanitizeNextRedirect (Open Redirect Prevention)', () => {
  const fallback = '/dashboard';

  it('permite caminhos relativos válidos com ou sem query params', () => {
    expect(sanitizeNextRedirect('/treinador', fallback)).toBe('/treinador');
    expect(sanitizeNextRedirect('/clube/treinador?foo=bar', fallback)).toBe('/clube/treinador?foo=bar');
    expect(sanitizeNextRedirect('/match/123/scoring#tab', fallback)).toBe('/match/123/scoring#tab');
  });

  it('rejeita URLs com esquemas absolutos (http, https, javascript)', () => {
    expect(sanitizeNextRedirect('http://evil.com', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('https://evil.com/path', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('javascript:alert(1)', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('data:text/html,<script>alert(1)</script>', fallback)).toBe(fallback);
  });

  it('rejeita protocolo relativo e evasões de barra invertida', () => {
    expect(sanitizeNextRedirect('//evil.com', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('/\\evil.com', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('\\evil.com', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('///evil.com', fallback)).toBe(fallback);
  });

  it('rejeita caracteres de controle e quebras de linha', () => {
    expect(sanitizeNextRedirect('/safe\r\n/evil', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('/safe\t/evil', fallback)).toBe(fallback);
  });

  it('retorna o fallback quando o valor de entrada é nulo, vazio ou inválido', () => {
    expect(sanitizeNextRedirect(null, fallback)).toBe(fallback);
    expect(sanitizeNextRedirect(undefined, fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('   ', fallback)).toBe(fallback);
    expect(sanitizeNextRedirect('relative-without-slash', fallback)).toBe(fallback);
  });
});

