import { isMatchScheduledForFuture } from '../schedule-check.helpers';

describe('isMatchScheduledForFuture', () => {
  // Fixando o "now" em: 2026-09-30 14:00:00 local
  const baseNow = new Date(2026, 8, 30, 14, 0, 0, 0);

  it('retorna true quando a data for diferente da atual (dia seguinte)', () => {
    expect(isMatchScheduledForFuture('2026-10-01', '10:00', baseNow)).toBe(true);
  });

  it('retorna true quando a data for diferente da atual (dia anterior)', () => {
    expect(isMatchScheduledForFuture('2026-09-29', '14:00', baseNow)).toBe(true);
  });

  it('retorna true quando for na mesma data mas com mais de 5 minutos da hora atual (ex: 14:06 vs 14:00)', () => {
    expect(isMatchScheduledForFuture('2026-09-30', '14:06', baseNow)).toBe(true);
    expect(isMatchScheduledForFuture('2026-09-30', '14:30', baseNow)).toBe(true);
    expect(isMatchScheduledForFuture('2026-09-30', '18:00', baseNow)).toBe(true);
  });

  it('retorna false quando for na mesma data e dentro da janela de 5 minutos (ex: 14:05, 14:02)', () => {
    expect(isMatchScheduledForFuture('2026-09-30', '14:05', baseNow)).toBe(false);
    expect(isMatchScheduledForFuture('2026-09-30', '14:02', baseNow)).toBe(false);
    expect(isMatchScheduledForFuture('2026-09-30', '14:00', baseNow)).toBe(false);
  });

  it('retorna false quando for na mesma data mas horário já passou (ex: 13:45 vs 14:00)', () => {
    expect(isMatchScheduledForFuture('2026-09-30', '13:45', baseNow)).toBe(false);
  });

  it('retorna false quando data ou hora estiverem indefinidas ou inválidas', () => {
    expect(isMatchScheduledForFuture('', '14:00', baseNow)).toBe(false);
    expect(isMatchScheduledForFuture('2026-09-30', '', baseNow)).toBe(false);
    expect(isMatchScheduledForFuture(undefined, undefined, baseNow)).toBe(false);
    expect(isMatchScheduledForFuture('invalid', 'invalid', baseNow)).toBe(false);
  });
});
