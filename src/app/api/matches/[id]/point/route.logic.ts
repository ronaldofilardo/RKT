import { ScoringEngine } from '@/core/scoring/engine';
import { normalizeScoreState, extractHistory } from '@/core/scoring/score-normalizer';
import { buildEngineConfig } from '@/core/scoring/engine-config';
import { logger } from '@/lib/logger';
import type { PointFlowInput } from '@/schemas/contracts';
import { TransactionError } from './point-route-errors';

export { TransactionError, reportPointRouteFailure } from './point-route-errors';
export { validateMatchAnnotatorPermission } from './point-route-permission.logic';

export function restoreEngineFromMatch(match: {
  format: string;
  player1Id: string;
  player2Id: string;
  initialServerId: string;
  scoreState: unknown;
}): ScoringEngine {
  let scoreStateToUse = match.scoreState;
  if (scoreStateToUse && typeof scoreStateToUse === 'object') {
    const normalized = normalizeScoreState(scoreStateToUse, match.format as Parameters<typeof normalizeScoreState>[1]);
    if (normalized) {
      scoreStateToUse = normalized;
    }
  }

  if (scoreStateToUse && typeof scoreStateToUse === 'object') {
    const ss = scoreStateToUse as Record<string, unknown>;
    const innerState = (ss.state ?? ss) as Record<string, unknown>;
    if (innerState?.isFinished === true) {
      logger.point.matchAlreadyFinished(innerState?.winner as string | undefined);
      throw new TransactionError('Partida já finalizada', 422, 'MATCH_ALREADY_FINISHED');
    }
  }

  const engineConfig = buildEngineConfig(match);

  const engine = scoreStateToUse
    ? ScoringEngine.fromSerialized(engineConfig, JSON.stringify(scoreStateToUse))
    : new ScoringEngine(engineConfig);

  // BUG FIX (2026-09-27) — CRÍTICO: normalizeScoreState() sempre retorna só
  // o `state` saneado, nunca o `history` — mesmo quando match.scoreState já
  // era o envelope completo {state, history}. Como esta função constrói o
  // engine usado em TODA transação real de ponto (POST /point, via
  // route.ts), o engine sempre nascia com histórico VAZIO; applyPoint()
  // então salvava só o ponto ATUAL nesse histórico, e essa versão de 1
  // único ponto era persistida de volta em match.scoreState (snapshot =
  // engine.serialize()). Resultado: o `history` gravado no banco nunca
  // acumulava mais de 1 ponto por vez. Isso não corrompe o placar (que
  // depende só do `state`), mas corrompe qualquer leitura futura do
  // histórico completo a partir do scoreState persistido — em particular,
  // a timeline ao vivo em /scoring (engineRef.current.getPointHistory() no
  // cliente) podia reidratar com só 1 ponto sempre que um fetchMatch(true)
  // recarregava o engine a partir do servidor. Corrigido restaurando o
  // histórico original (extraído do match.scoreState ANTES da
  // normalização) sobre o estado saneado.
  if (engine.getHistoryLength() === 0) {
    const originalHistory = extractHistory(match.scoreState);
    if (originalHistory && originalHistory.length > 0) {
      engine.restorePointHistory(originalHistory as unknown as Parameters<typeof engine.restorePointHistory>[0]);
    }
  }

  return engine;
}

export function buildAnnotationsPayload(
  data: PointFlowInput,
  doublesMeta?: {
    hitterId?: string;
    receiverId?: string;
    courtSide?: 'deuce' | 'ad';
  },
) {
  const hasFirstFaultDetail = Boolean(
    data.firstFaultDetail &&
      (data.firstFaultDetail.errorType ||
        data.firstFaultDetail.serveEffect ||
        data.firstFaultDetail.direction ||
        Object.keys(data.firstFaultDetail).length > 0)
  ) || Boolean(
    data.annotations?.firstFaultDetail &&
      (data.annotations.firstFaultDetail.errorType ||
        data.annotations.firstFaultDetail.serveEffect ||
        data.annotations.firstFaultDetail.direction ||
        Object.keys(data.annotations.firstFaultDetail).length > 0)
  );

  const isExplicitSecondServe =
    data.type === 'DOUBLE_FAULT' ||
    hasFirstFaultDetail ||
    data.isSecondServe === true ||
    data.annotations?.isSecondServe === true ||
    data.isFirstServe === false ||
    data.annotations?.isFirstServe === false;

  const isSecondServe = isExplicitSecondServe;
  const isFirstServe = !isSecondServe;

  const firstFaultDetail =
    data.firstFaultDetail ??
    data.annotations?.firstFaultDetail ??
    undefined;

  const rallyDetails =
    data.rallyDetails ??
    data.annotations?.rallyDetails ??
    undefined;

  const rallyLength =
    data.rallyLength ??
    data.annotations?.rallyLength ??
    undefined;

  const note =
    data.annotations?.note ??
    rallyDetails?.note ??
    undefined;

  const zone = data.annotations?.zone;
  const stroke = data.annotations?.stroke;

  const hitterId = doublesMeta?.hitterId ?? data.hitterId ?? data.annotations?.hitterId;
  const receiverId = doublesMeta?.receiverId ?? data.receiverId ?? data.annotations?.receiverId;
  const courtSide = doublesMeta?.courtSide ?? data.courtSide ?? data.annotations?.courtSide;

  return {
    ...(data.annotations ?? {}),
    isFirstServe,
    isSecondServe,
    ...(firstFaultDetail !== undefined ? { firstFaultDetail } : {}),
    ...(rallyDetails !== undefined ? { rallyDetails } : {}),
    ...(rallyLength !== undefined ? { rallyLength } : {}),
    ...(note !== undefined ? { note } : {}),
    ...(zone !== undefined ? { zone } : {}),
    ...(stroke !== undefined ? { stroke } : {}),
    ...(hitterId !== undefined ? { hitterId } : {}),
    ...(receiverId !== undefined ? { receiverId } : {}),
    ...(courtSide !== undefined ? { courtSide } : {}),
  };
}

