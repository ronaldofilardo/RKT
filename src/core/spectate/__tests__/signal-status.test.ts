import { calculateSignalStatus } from '../signal-status';

describe('calculateSignalStatus (domínio puro)', () => {
  const baseNow = 1_700_000_000_000;

  it('retorna NOT_STARTED quando o estado é SCHEDULED ou total de pontos é 0', () => {
    const res = calculateSignalStatus({
      matchState: 'SCHEDULED',
      hasActiveSession: false,
      nowMs: baseNow,
    });
    expect(res.status).toBe('NOT_STARTED');
    expect(res.lastSignalAt).toBeNull();

    const resZeroPoints = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: true,
      totalPoints: 0,
      nowMs: baseNow,
    });
    expect(resZeroPoints.status).toBe('NOT_STARTED');
  });

  it('retorna FINISHED quando o estado é FINISHED ou CANCELLED', () => {
    expect(
      calculateSignalStatus({ matchState: 'FINISHED', hasActiveSession: true, totalPoints: 0, nowMs: baseNow }).status
    ).toBe('FINISHED');
    expect(
      calculateSignalStatus({ matchState: 'CANCELLED', hasActiveSession: false, nowMs: baseNow }).status
    ).toBe('FINISHED');
  });

  it('retorna PAUSED quando IN_PROGRESS mas sem sessão ativa', () => {
    const res = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: false,
      totalPoints: 10,
      nowMs: baseNow,
    });
    expect(res.status).toBe('PAUSED');
  });

  it('não retorna PAUSED quando chegou ponto depois da última mudança de sessão', () => {
    const res = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: false,
      totalPoints: 10,
      lastPointReceivedAt: new Date(baseNow - 10_000),
      lastSessionChangeAt: new Date(baseNow - 600_000),
      nowMs: baseNow,
    });
    expect(res.status).toBe('LIVE');
  });

  it('mantém PAUSED quando o último ponto é anterior à pausa da sessão', () => {
    const res = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: false,
      totalPoints: 10,
      lastPointReceivedAt: new Date(baseNow - 60_000),
      lastSessionChangeAt: new Date(baseNow - 30_000),
      nowMs: baseNow,
    });
    expect(res.status).toBe('PAUSED');
  });

  it('retorna LIVE quando o sinal recente é menor que 30 segundos', () => {
    const res = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: true,
      totalPoints: 10,
      lastHeartbeatAt: new Date(baseNow - 15_000),
      nowMs: baseNow,
    });
    expect(res.status).toBe('LIVE');
    expect(res.ageSeconds).toBe(15);
  });

  it('retorna NO_SIGNAL quando o sinal mais recente tem mais de 30 segundos', () => {
    const res = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: true,
      totalPoints: 10,
      lastHeartbeatAt: new Date(baseNow - 45_000),
      nowMs: baseNow,
    });
    expect(res.status).toBe('NO_SIGNAL');
    expect(res.ageSeconds).toBe(45);
  });

  it('usa o mais recente entre heartbeat e point receivedAt', () => {
    const res = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: true,
      lastHeartbeatAt: new Date(baseNow - 80_000),
      lastPointReceivedAt: new Date(baseNow - 10_000),
      nowMs: baseNow,
    });
    expect(res.status).toBe('LIVE');
    expect(res.ageSeconds).toBe(10);
  });

  it('retorna CATCH_UP quando há 2 ou mais pontos atrasados recebidos em lote', () => {
    const res = calculateSignalStatus({
      matchState: 'IN_PROGRESS',
      hasActiveSession: true,
      lastPointReceivedAt: new Date(baseNow - 5_000),
      catchUpCount: 3,
      nowMs: baseNow,
    });
    expect(res.status).toBe('CATCH_UP');
  });
});

