import type { SpectatorFeedStatus, SpectatorRhythmState, SpectatorPoint } from './types';

export interface DeriveMatchRhythmParams {
  feedStatus: SpectatorFeedStatus;
  lastPoint?: SpectatorPoint | null;
  lastPointTimestampMs?: number | null;
  nowMs: number;
  serverSideLabel?: string | null;
  isSetEndingPoint?: boolean;
  isGameEndingPoint?: boolean;
  gameSum?: number;
}

/**
 * Deriva de forma pura o ritmo contextual da partida e o delay adaptativo para o polling.
 * Opção B: Poupa ~80% de chamadas ao relaxar quando a bola está em jogo ou em intervalos.
 */
export function deriveMatchRhythm(params: DeriveMatchRhythmParams): SpectatorRhythmState {
  const { feedStatus, lastPointTimestampMs, nowMs, serverSideLabel, isSetEndingPoint, isGameEndingPoint, gameSum = 0 } = params;

  if (feedStatus === 'FINISHED') {
    return { kind: 'FINISHED', label: 'Partida encerrada', nextPollDelayMs: 0 };
  }
  if (feedStatus === 'PAUSED') {
    return { kind: 'PAUSED', label: 'Anotação pausada temporariamente pelo anotador', nextPollDelayMs: 15_000 };
  }
  if (feedStatus === 'NO_SIGNAL') {
    return { kind: 'NO_SIGNAL', label: 'Sem sinal do anotador (placar mantido no último recebido)', nextPollDelayMs: 15_000 };
  }
  if (feedStatus === 'NOT_STARTED') {
    return { kind: 'WAITING_NEXT_POINT', label: 'Aguardando início da partida pelo anotador', nextPollDelayMs: 10_000 };
  }

  // Intervalos regulamentares do tênis
  if (isSetEndingPoint) {
    return { kind: 'SET_BREAK', label: 'Intervalo entre sets', nextPollDelayMs: 30_000 };
  }

  if (isGameEndingPoint && gameSum % 2 !== 0) {
    return { kind: 'CHANGEOVER_BREAK', label: 'Intervalo: Troca de lados (90s)', nextPollDelayMs: 20_000 };
  }

  const elapsedSincePointMs = lastPointTimestampMs ? Math.max(0, nowMs - lastPointTimestampMs) : 999_999;

  // Nos primeiros 30s após o ponto: rali em disputa
  if (elapsedSincePointMs <= 30_000) {
    const sacador = serverSideLabel ? ` (sacando ${serverSideLabel})` : '';
    return {
      kind: 'RALLY_IN_PROGRESS',
      label: `Ponto em disputa...${sacador}`,
      nextPollDelayMs: 8_000,
    };
  }

  // Acima de 90s sem anotação: espera prolongada
  if (elapsedSincePointMs > 90_000) {
    return {
      kind: 'WAITING_NEXT_POINT',
      label: 'Aguardando próximo saque ou marcação do anotador...',
      nextPollDelayMs: 15_000,
    };
  }

  return {
    kind: 'WAITING_NEXT_POINT',
    label: 'Aguardando marcação do ponto...',
    nextPollDelayMs: 8_000,
  };
}

