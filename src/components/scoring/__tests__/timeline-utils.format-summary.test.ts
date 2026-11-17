/**
 * Split de timeline-utils.test.ts — describes "formatPointDetailsShort",
 * "formatPointDetailsFull" e "getPointDetailSummary". Asserções 1:1.
 */
import { formatPointDetailsShort, formatPointDetailsFull, getPointDetailSummary } from '../timeline.logic';

describe('formatPointDetailsShort', () => {
  it('deve retornar versão curta', () => {
    const rd = { vencedor: 'sacador' as const, situacao: 'rede' as const, tipo: 'winner' as const, golpe: 'vfh' as const, previewBalls: 1 };
    expect(formatPointDetailsShort(rd)).toContain('Rede');
    expect(formatPointDetailsShort(rd)).toContain('VFH');
  });

  it('deve retornar – para null', () => {
    expect(formatPointDetailsShort(null)).toBe('–');
  });
});

describe('formatPointDetailsFull', () => {
  it('deve retornar versão completa', () => {
    const rd = { vencedor: 'devolvedor' as const, situacao: 'fundo' as const, tipo: 'erro_forcado' as const, golpe: 'bh' as const, previewBalls: 2 };
    expect(formatPointDetailsFull(rd)).toContain('Devolvedor');
    expect(formatPointDetailsFull(rd)).toContain('FQ');
  });
});

describe('getPointDetailSummary', () => {
  it('deve retornar green para winner', () => {
    const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'winner' as const, golpe: 'fh' as const, previewBalls: 1 };
    const result = getPointDetailSummary(rd);
    expect(result.label).toBe('W');
    expect(result.color).toBe('green');
  });

  it('deve retornar red para erro_nao_forcado', () => {
    const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'erro_nao_forcado' as const, golpe: 'fh' as const, previewBalls: 1 };
    const result = getPointDetailSummary(rd);
    expect(result.label).toBe('ENF');
    expect(result.color).toBe('red');
  });

  it('deve retornar amber para erro_forcado', () => {
    const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'erro_forcado' as const, golpe: 'fh' as const, previewBalls: 1 };
    const result = getPointDetailSummary(rd);
    expect(result.label).toBe('EF');
    expect(result.color).toBe('amber');
  });

  it('deve retornar DF em red para dupla_falta (regressão do bug tipo=erro_nao_forcado)', () => {
    const rd = { vencedor: 'devolvedor' as const, situacao: 'saque' as const, tipo: 'dupla_falta' as const, golpe: 'saque' as const, previewBalls: 1 };
    const result = getPointDetailSummary(rd);
    expect(result.label).toBe('DF');
    expect(result.color).toBe('red');
  });

  it('deve retornar gray para undefined', () => {
    const result = getPointDetailSummary(undefined);
    expect(result.label).toBe('–');
    expect(result.color).toBe('gray');
  });

  it('deve retornar gray e label da tipo para ACE', () => {
    const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'ace' as const, golpe: 'fh' as const, previewBalls: 1 };
    const result = getPointDetailSummary(rd);
    expect(result.color).toBe('gray');
  });

  it('deve retornar gray e label da tipo para DOUBLE_FAULT', () => {
    const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'double_fault' as const, golpe: 'fh' as const, previewBalls: 1 };
    const result = getPointDetailSummary(rd);
    expect(result.color).toBe('gray');
  });

  it('deve retornar gray e label da tipo para FORCED_ERROR', () => {
    const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'forced_error' as const, golpe: 'fh' as const, previewBalls: 1 };
    const result = getPointDetailSummary(rd);
    expect(result.color).toBe('gray');
  });
});
