import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringEngineConfig } from '@/core/scoring/types';
import type { MatchDataWithSequence } from './useScoringHandlers.match-fetch.types';

/**
 * Reconstrói o engine reaplicando os PointLogs ativos desde a última edição
 * manual (`activeLogsSinceEdit`). Retorna `null` quando o replay falha ou não
 * há logs — o chamador deve cair para o fallback `fromSerialized`.
 */
export function rehydrateEngineFromLogs(
  config: ScoringEngineConfig,
  data: MatchDataWithSequence,
): ScoringEngine | null {
  try {
    let rehydratedEngine: ScoringEngine;
    if (data.lastScoreEdit?.newScoreState) {
      rehydratedEngine = ScoringEngine.fromSerialized(config, JSON.stringify(data.lastScoreEdit.newScoreState));
    } else {
      rehydratedEngine = new ScoringEngine(config);
    }

    for (const log of data.activeLogsSinceEdit!) {
      const ann = log.annotations;
      const firstFaultDetail = ann?.firstFaultDetail ?? null;
      const isSecondServe =
        log.type === 'DOUBLE_FAULT' ||
        Boolean(firstFaultDetail) ||
        ann?.isSecondServe === true ||
        ann?.isFirstServe === false;
      const isFirstServe = !isSecondServe;

      rehydratedEngine.applyPoint({
        winnerId: log.winnerId,
        type: log.type,
        serverId: log.serverId,
        timestamp: log.timestamp ? new Date(log.timestamp).getTime() : Date.now(),
        isFirstServe,
        isSecondServe,
        firstFault: log.type === 'FAULT_FIRST',
        firstFaultDetail,
        rallyDetails: ann?.rallyDetails ?? null,
        rallyLength: ann?.rallyLength,
        hitterId: ann?.hitterId ?? undefined,
        receiverId: ann?.receiverId ?? undefined,
        courtSide: ann?.courtSide ?? undefined,
      });
    }

    return rehydratedEngine;
  } catch (replayError) {
    logger.warn('[MATCH FETCH] Replay de activeLogsSinceEdit falhou; caindo para fromSerialized:', replayError);
    return null;
  }
}
