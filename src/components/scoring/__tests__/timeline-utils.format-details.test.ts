/**
 * Split de timeline-utils.test.ts — describe "formatPointDetails":
 * formatação completa, parcial e os padrões para undefined/null. Asserções 1:1.
 */
import { formatPointDetails } from '../timeline.logic';
import { COMPLETE_RALLY_DETAILS } from './timelineUtilsTestKit';

describe('formatPointDetails', () => {
  const completeRallyDetails = COMPLETE_RALLY_DETAILS;

  it('deve formatar rally details completo', () => {
    const result = formatPointDetails(completeRallyDetails);
    expect(result.tipo).toBe('W');
    expect(result.situacao).toBe('FQ');
    expect(result.golpe).toBe('FH');
    expect(result.direcao).toBe('X');
    expect(result.efeito).toBe('Top');
    expect(result.golpeEsp).toBe('Lob');
  });

  it('deve formatar rally details parcial', () => {
    const partial = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'winner' as const, golpe: 'fh' as const, previewBalls: 1 };
    const result = formatPointDetails(partial);
    expect(result.short).toBe('FQ • FH');
    expect(result.golpe).toBe('FH');
  });

  it('deve retornar valores padrão para undefined', () => {
    const result = formatPointDetails(undefined);
    expect(result.short).toBe('–');
    expect(result.full).toBe('–');
    expect(result.tipo).toBe('–');
  });

  it('deve retornar valores padrão para null', () => {
    const result = formatPointDetails(null);
    expect(result.short).toBe('–');
    expect(result.full).toBe('–');
  });

  it('short deve conter situacao e golpe', () => {
    const result = formatPointDetails(completeRallyDetails);
    expect(result.short).toContain('FQ');
    expect(result.short).toContain('FH');
  });

  it('full deve conter todos os campos', () => {
    const result = formatPointDetails(completeRallyDetails);
    expect(result.full).toContain('Sacador');
    expect(result.full).toContain('FQ');
    expect(result.full).toContain('W');
    expect(result.full).toContain('FH');
  });
});
