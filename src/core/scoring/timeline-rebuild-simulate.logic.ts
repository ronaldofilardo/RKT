import type { PointDetails, ScoringEngineConfig, HistoryEntry } from '@/core/scoring/types';
import type { PointLogRow } from './point-log-merge';
import { ScoringEngine } from '@/core/scoring/engine';
import { unwrapStateEnvelope } from '@/core/scoring/state-envelope';
import { pointLogToFlow } from './timeline-rebuild.logic';
import { buildPointDetailsFromLog } from './point-log-merge';

export interface TimelineScoreEdit {
  editedAt: Date;
  /** Estado cru, envelope `{state, history}` ou string JSON serializada. */
  newScoreState: unknown;
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

export type { PointLogRow };
