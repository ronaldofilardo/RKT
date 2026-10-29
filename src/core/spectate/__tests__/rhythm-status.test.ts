import { deriveMatchRhythm } from '../rhythm-status';

describe('deriveMatchRhythm (ritmo contextual e polling adaptativo)', () => {
  const baseNow = 1_700_000_000_000;

  it('retorna FINISHED e 0ms de delay ao encerrar', () => {
    const res = deriveMatchRhythm({ feedStatus: 'FINISHED', nowMs: baseNow });
    expect(res.kind).toBe('FINISHED');
    expect(res.nextPollDelayMs).toBe(0);
  });

  it('retorna SET_BREAK e delay estendido de 30s quando ponto fechou set', () => {
    const res = deriveMatchRhythm({
      feedStatus: 'LIVE',
      isSetEndingPoint: true,
      nowMs: baseNow,
    });
    expect(res.kind).toBe('SET_BREAK');
    expect(res.nextPollDelayMs).toBe(30_000);
  });

  it('retorna CHANGEOVER_BREAK e delay de 20s quando fechou game com soma ímpar', () => {
    const res = deriveMatchRhythm({
      feedStatus: 'LIVE',
      isGameEndingPoint: true,
      gameSum: 3, // 2x1 = 3 -> troca de lado
      nowMs: baseNow,
    });
    expect(res.kind).toBe('CHANGEOVER_BREAK');
    expect(res.nextPollDelayMs).toBe(20_000);
  });

  it('retorna RALLY_IN_PROGRESS nos primeiros 30s após o ponto', () => {
    const res = deriveMatchRhythm({
      feedStatus: 'LIVE',
      lastPointTimestampMs: baseNow - 10_000,
      serverSideLabel: 'Carlos',
      nowMs: baseNow,
    });
    expect(res.kind).toBe('RALLY_IN_PROGRESS');
    expect(res.label).toContain('sacando Carlos');
    expect(res.nextPollDelayMs).toBe(8_000);
  });

  it('retorna WAITING_NEXT_POINT com delay maior após 90s sem ponto', () => {
    const res = deriveMatchRhythm({
      feedStatus: 'LIVE',
      lastPointTimestampMs: baseNow - 95_000,
      nowMs: baseNow,
    });
    expect(res.kind).toBe('WAITING_NEXT_POINT');
    expect(res.label).toContain('Aguardando próximo saque');
    expect(res.nextPollDelayMs).toBe(15_000);
  });
});

