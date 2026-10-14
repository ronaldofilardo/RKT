import type {
  TimelinePoint,
  PointDetails,
  ScoringEngineConfig,
  HistoryEntry,
} from '@/core/scoring/types';
import type { PointLogRow } from './point-log-merge';
import { ScoringEngine } from '@/core/scoring/engine';
import { enrichPointsFromHistory } from '@/core/scoring/scoring-logic';
import { unwrapStateEnvelope } from '@/core/scoring/state-envelope';
import { pointLogToFlow } from './timeline-rebuild.helpers';
import {
  buildPointDetailsFromLog,
  mergeWithPointLog,
} from './point-log-merge';

// Fonte canônica do tipo movida para `point-log-merge.ts`. Re-exportado para
// manter a API pública existente (rotas de relatório, shadow-replay, testes).
export type { PointLogRow } from './point-log-merge';

export interface TimelineScoreEdit {
  editedAt: Date;
  /** Estado cru, envelope `{state, history}` ou string JSON serializada. */
  newScoreState: unknown;
}

/**
 * Reconstrói a timeline completa do relatório a partir dos `PointLog`
 * (fonte imutável e completa de anotações), usando `scoreState.history`
 * (quando cobre todos os PointLog) ou — no cenário em que o `history`
 * está incompleto (após undos/syncs que descartaram entradas antigas) —
 * SIMULANDO o placar ponto a ponto a partir do estado inicial por meio
 * do `ScoringEngine`, garantindo que GAME/PONTO/SET sempre reflitam o
 * placar real do momento de cada ponto, em vez de zeros.
 *
 * As anotações detalhadas (rallyDetails, firstFault, note, áudio) sempre
 * vêm do PointLog — nunca do history — porque o PointLog é a fonte de
 * verdade pós-gravação.
 *
 * @param history        Histórico vindo do `scoreState` serializado.
 *                       Ignorado quando seu comprimento é menor que o de
 *                       `pointLogs` (caminho de reconstrução simulada).
 * @param pointLogs      Todos os PointLog da partida, ordenados por timestamp.
 * @param config         Configuração do engine (player1Id, player2Id,
 *                       initialServerId, format). Necessário para a
 *                       simulação do placar acumulado.
 */
export function rebuildTimelineFromPointLogs(
  history: TimelinePoint[],
  pointLogs: PointLogRow[],
  player1Id: string,
  player2Id: string,
  initialServerId: string,
  format?: string,
  scoreEdits: TimelineScoreEdit[] = [],
): TimelinePoint[] {
  if (pointLogs.length === 0) return history;

  const config: ScoringEngineConfig = {
    format: format as ScoringEngineConfig['format'],
    player1Id,
    player2Id,
    initialServerId,
  };

  // Caminho nominal: history cobre todos os PointLog — preserva stateBefore
  // exatamente como persistido (inclui situações pós-edição manual e
  // tiebreaks que seriam custosos de ressuscitar pela simulação), apenas
  // sobrescrevendo as anotações detalhadas com os dados frescos do PointLog.
  if (history.length >= pointLogs.length) {
    return history.map((p, i) => mergeWithPointLog(p, pointLogs[i], i + 1));
  }

  // Caminho de RECONSTRUÇÃO: history incompleto (ou vazio). Simula o placar
  // acumulado a partir do estado inicial, aplicando cada PointLog no engine.
  // Cada `HistoryEntry.stateBefore` devolvido carrega o placar real do
  // momento daquele ponto (games/game/set/server/BP/GB/SB), e o `point`
  // carrega os metadados brutos — depois sobrescrevemos as anotações com os
  // dados frescos do PointLog correspondente.
  const simulatedHistory = simulateScoreFromPointLogs(pointLogs, config, scoreEdits);
  const enriched = enrichPointsFromHistory(simulatedHistory, player1Id, player2Id);
  return enriched.map((p, i) => mergeWithPointLog(p, pointLogs[i], i + 1));
}

/**
 * Simula o acúmulo de placar a partir do estado inicial da partida, aplicando
 * cada `PointLogRow` como um `PointFlow` no `ScoringEngine`. Devolve um
 * `HistoryEntry[]` (um por ponto) onde `stateBefore` é o placar exatamente
 * ANTES daquele ponto ser computado.
 *
 * Falhas lors da aplicação (ex.: match já finalizada mas com PointLog extra
 * por inconsistência de dados) não abortam a reconstrução: o ponto
 * problemático recebe o último `stateBefore` conhecido como fallback, de
 * modo que a UI ainda renderize um placar coerente em vez de zeros.
 */
export function simulateScoreFromPointLogs(
  pointLogs: PointLogRow[],
  config: ScoringEngineConfig,
  scoreEdits: TimelineScoreEdit[] = [],
): HistoryEntry[] {
  const engine = new ScoringEngine(config);
  const history: HistoryEntry[] = [];
  let lastStateBefore = engine.getState();
  let nextEditIndex = 0;

  for (const log of pointLogs) {
    const flow = pointLogToFlow(log);

    // Apply any score edits that happened before this point
    while (
      nextEditIndex < scoreEdits.length &&
      scoreEdits[nextEditIndex].editedAt.getTime() < log.timestamp.getTime()
    ) {
      try {
        const raw = scoreEdits[nextEditIndex].newScoreState;
        const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const unpacked = unwrapStateEnvelope(parsed);
        if (unpacked && Array.isArray(unpacked.sets)) {
          engine.loadState(unpacked);
          lastStateBefore = engine.getState();
        }
      } catch {
        // ste-exception R-08: domínio puro (R-05) — I/O proibido.
        // Entrada corrompida degrada para o último estado válido reconstruído.
      }
      nextEditIndex++;
    }

    let stateBefore: ReturnType<typeof engine.getState>;
    let details: PointDetails | null;
    try {
      stateBefore = engine.getState();
      engine.applyPoint(flow);
      details = extractLastPointDetailsFromEngine(engine) ?? buildPointDetailsFromLog(log);

      lastStateBefore = engine.getState();
    } catch {
      // Engine rejeitou a aplicação (ex.: MATCH_ALREADY_FINISHED).
      // Reaproveita o último stateBefore e constrói um PointDetails a partir
      // do PointLog, mantendo o seviço do relatório resiliente a dados
      // inconsistentes sem produzir placar zero.
      history.push({
        stateBefore: lastStateBefore,
        point: buildPointDetailsFromLog(log),
      });
      continue;
    }

    history.push({
      stateBefore,
      point: details ?? buildPointDetailsFromLog(log),
    });
  }

  return history;
}

/**
 * Extrai o `PointDetails` do último ponto aplicado no engine, consultando
 * o histórico interno. Como `engine.applyPoint` sempre chama `saveToHistory`
 * antes de processar (ver `engine.ts:71,79,86`), a última entrada é o ponto
 * recém-aplicado.
 */
function extractLastPointDetailsFromEngine(engine: ScoringEngine): PointDetails | null {
  const pointHistory = engine.getPointHistory();
  return pointHistory.length > 0 ? pointHistory[pointHistory.length - 1].point : null;
}
