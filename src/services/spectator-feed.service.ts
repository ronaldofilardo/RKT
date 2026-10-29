import { getFeedAggregation, computeFeedFingerprint } from './spectator-feed.fingerprint';
import { buildFullSpectatorView } from './spectator-feed.builder';
import { calculateSignalStatus, deriveMatchRhythm } from '@/core/spectate';

export interface GetSpectatorFeedParams {
  matchId: string;
  clientRev?: string;
  guardianPlayerIds?: readonly string[];
  nowMs?: number;
}

export async function getSpectatorFeed(params: GetSpectatorFeedParams) {
  const { matchId, clientRev, guardianPlayerIds, nowMs = Date.now() } = params;

  // 1. Passo 0: Agregação barata de escalares (< 150 bytes no banco)
  const agg = await getFeedAggregation(matchId);
  if (!agg || !agg.match) return { ok: false as const, error: 'NOT_FOUND', status: 404 };

  const rev = computeFeedFingerprint(agg);
  const signal = calculateSignalStatus({
    matchState: agg.match.state,
    hasActiveSession: agg.hasActiveSession,
    totalPoints: agg.pointCount,
    lastHeartbeatAt: agg.lastHeartbeatAt,
    lastPointReceivedAt: agg.lastReceivedAt,
    lastSessionChangeAt: agg.lastSessionChangeAt,
    nowMs,
  });

  const lastPointTimestampMs = agg.lastReceivedAt ? new Date(agg.lastReceivedAt).getTime() : null;
  const rhythm = deriveMatchRhythm({
    feedStatus: signal.status,
    lastPointTimestampMs,
    nowMs,
  });

  // 2. Se a impressão digital é idêntica à do cliente: devolve APENAS status e sinal (SEM carregar pontos!)
  if (clientRev && clientRev === rev) {
    return {
      ok: true as const,
      rev,
      status: signal.status,
      signal: { lastSignalAt: signal.lastSignalAt, ageSeconds: signal.ageSeconds },
      rhythm,
      nextPollInMs: rhythm.nextPollDelayMs,
      serverTime: nowMs,
    };
  }

  // 3. Se houve alteração: carrega dados completos projetados
  const view = await buildFullSpectatorView({
    matchId,
    annotatorName: agg.annotatorName,
    guardianPlayerIds,
  });

  return {
    ok: true as const,
    rev,
    status: signal.status,
    signal: { lastSignalAt: signal.lastSignalAt, ageSeconds: signal.ageSeconds },
    rhythm,
    nextPollInMs: rhythm.nextPollDelayMs,
    serverTime: nowMs,
    view: view ?? undefined,
  };
}
