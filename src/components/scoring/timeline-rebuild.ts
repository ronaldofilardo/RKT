import type {
  TimelinePoint,
  PointDetails,
  RallyDetails,
  ScoringEngineConfig,
  HistoryEntry,
} from '@/core/scoring/types';
import { ScoringEngine } from '@/core/scoring/engine';
import { enrichPointsFromHistory } from '@/core/scoring/scoring-logic';
import {
  addFailedEntry,
  addSuccessfulEntry,
  getLastPointDetails,
  pointLogToFlow,
} from './timeline-rebuild.helpers';
import { getLogPointDetails, mergeTimelinePoint } from './timeline-rebuild.merge.helpers';

/**
 * Estrutura mínima vinda do `prisma.pointLog.findMany` usada na reconstrução
 * do relatório. Mantida aqui (em vez de importar o tipo Prisma) para isolar a
 * rota de tipos de schema e facilitar testes.
 */
export interface PointLogRow {
  id: string;
  winnerId: string;
  type: string;
  serverId: string;
  timestamp: Date;
  annotations:
    | {
        rallyDetails?: RallyDetails | null;
        rallyLength?: number;
        isFirstServe?: boolean;
        isSecondServe?: boolean;
        firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
        note?: string;
      }
    | null;
  audioNote: Buffer | null;
  audioNoteDuration: number | null;
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
    return history.map((p, i) => mergeTimelinePoint(p, pointLogs[i], i + 1));
  }

  // Caminho de RECONSTRUÇÃO: history incompleto (ou vazio). Simula o placar
  // acumulado a partir do estado inicial, aplicando cada PointLog no engine.
  // Cada `HistoryEntry.stateBefore` devolvido carrega o placar real do
  // momento daquele ponto (games/game/set/server/BP/GB/SB), e o `point`
  // carrega os metadados brutos — depois sobrescrevemos as anotações com os
  // dados frescos do PointLog correspondente.
  const simulatedHistory = simulateScoreFromPointLogs(pointLogs, config);
  const enriched = enrichPointsFromHistory(simulatedHistory, player1Id, player2Id);
  return enriched.map((p, i) => mergeTimelinePoint(p, pointLogs[i], i + 1));
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
function simulateScoreFromPointLogs(
  pointLogs: PointLogRow[],
  config: ScoringEngineConfig,
): HistoryEntry[] {
  const engine = new ScoringEngine(config);
  const history: HistoryEntry[] = [];
  let lastStateBefore = engine.getState();

  for (const log of pointLogs) {
    const flow = pointLogToFlow(log);

    let stateBefore: ReturnType<typeof engine.getState>;
    let details: PointDetails | null;
    try {
      stateBefore = engine.getState();
      engine.applyPoint(flow);
      details = getLastPointDetails(engine) ?? getLogPointDetails(log);

      lastStateBefore = engine.getState();
    } catch {
      // Engine rejeitou a aplicação (ex.: MATCH_ALREADY_FINISHED).
      // Reaproveita o último stateBefore e constrói um PointDetails a partir
      // do PointLog, mantendo o seviço do relatório resiliente a dados
      // inconsistentes sem produzir placar zero.
      addFailedEntry(history, lastStateBefore, log);
      continue;
    }

    addSuccessfulEntry(history, stateBefore, details, log);
  }

  return history;
}
