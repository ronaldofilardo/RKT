import { ScoringEngine } from '@/core/scoring/engine';
import { normalizeScoreState, extractHistory } from '@/core/scoring/score-normalizer';
import { buildEngineConfig } from '@/core/scoring/engine-config';
import { logger } from '@/lib/logger';
import { TransactionError } from './point-route-errors';

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
