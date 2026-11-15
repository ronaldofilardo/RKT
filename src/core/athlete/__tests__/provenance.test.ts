import { formatProvenance } from '../provenance';

describe('formatProvenance (A0.12 Fase 7)', () => {
  it('une clube e UF com " - "', () => {
    expect(formatProvenance('Pinheiros', 'SP')).toBe('Pinheiros - SP');
  });

  it('retorna só o clube quando a UF não foi informada', () => {
    expect(formatProvenance('Clube Curitibano', null)).toBe('Clube Curitibano');
    expect(formatProvenance('Avulso', undefined)).toBe('Avulso');
  });

  it('retorna só a UF quando o clube não foi informado', () => {
    expect(formatProvenance(null, 'RJ')).toBe('RJ');
    expect(formatProvenance(undefined, 'BA')).toBe('BA');
  });

  it('retorna null quando nada foi informado', () => {
    expect(formatProvenance(null, null)).toBeNull();
    expect(formatProvenance(undefined, undefined)).toBeNull();
    expect(formatProvenance('', '')).toBeNull();
  });

  it('ignora espaços em branco nas pontas', () => {
    expect(formatProvenance('  Pinheiros  ', '  SP  ')).toBe('Pinheiros - SP');
    expect(formatProvenance('   ', 'SP')).toBe('SP');
    expect(formatProvenance('Pinheiros', '  ')).toBe('Pinheiros');
    expect(formatProvenance('  ', ' ')).toBeNull();
  });
});
