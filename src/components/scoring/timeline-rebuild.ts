import type {
  TimelinePoint,
  PointDetails,
  RallyDetails,
  ScoringEngineConfig,
  HistoryEntry,
} from '@/core/scoring/types';
import { ScoringEngine } from '@/core/scoring/engine';
import { enrichPointsFromHistory } from '@/core/scoring/scoring-logic';

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
    return history.map((p, i) => mergeWithPointLog(p, pointLogs[i], i + 1));
  }

  // Caminho de RECONSTRUÇÃO: history incompleto (ou vazio). Simula o placar
  // acumulado a partir do estado inicial, aplicando cada PointLog no engine.
  // Cada `HistoryEntry.stateBefore` devolvido carrega o placar real do
  // momento daquele ponto (games/game/set/server/BP/GB/SB), e o `point`
  // carrega os metadados brutos — depois sobrescrevemos as anotações com os
  // dados frescos do PointLog correspondente.
  const simulatedHistory = simulateScoreFromPointLogs(pointLogs, config);
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
 * Converte um `PointLogRow` em `PointFlow` para alimentar o engine na
 * simulação. Mapeia `annotations` (rallyDetails, isFirstServe,
 * firstFaultDetail, etc.) para os campos correspondentes de PointFlow.
 *
 * Observação: quando o `type` do PointLog é `FAULT_FIRST` (1ª falta que
 * não encerra o ponto) ou `firstFaultDetail` está presente com tipo
 * `DOUBLE_FAULT`, é crucial sinalizar `firstFault: true` para que o
 * engine atualize apenas `secondServe` em vez de computar um ponto.
 */
function pointLogToFlow(log: PointLogRow): import('@/core/scoring/types').PointFlow {
  const ann = log.annotations;
  const type = log.type;
  return {
    winnerId: log.winnerId,
    type,
    serverId: log.serverId,
    timestamp: log.timestamp.getTime(),
    isFirstServe: ann?.isFirstServe,
    isSecondServe: ann?.isSecondServe,
    firstFault: type === 'FAULT_FIRST',
    firstFaultDetail: ann?.firstFaultDetail ?? null,
    rallyDetails: ann?.rallyDetails ?? null,
    rallyLength: ann?.rallyLength,
  };
}

/**
 * Extrai o `PointDetails` do último ponto aplicado no engine, consultando
 * o histórico interno. Como `engine.applyPoint` sempre chama `saveToHistory`
 * antes de processar (ver `engine.ts:71,79,86`), a última entrada é o ponto
 * recém-aplicado.
 */
function extractLastPointDetailsFromEngine(engine: ScoringEngine): PointDetails | null {
  const history = engine.getPointHistory();
  return history.length > 0 ? history[history.length - 1].point : null;
}

/**
 * Constrói um `PointDetails` mínimo a partir do `PointLogRow` — usado como
 * fallback quando o engine rejeitou o ponto ou quando há inconsistência de
 * dados. Prioriza os `annotations` do PointLog para preservar rallyDetails,
 * firstFaultDetail, etc., garantindo que as anotações detalhadas não se
 * percam mesmo em cenários degenerados.
 */
function buildPointDetailsFromLog(log: PointLogRow): PointDetails {
  const ann = log.annotations;
  return {
    winnerId: log.winnerId,
    type: log.type as PointDetails['type'],
    isFirstServe: ann?.isFirstServe ?? true,
    isSecondServe: ann?.isSecondServe ?? false,
    isLet: false,
    serverId: log.serverId,
    timestamp: log.timestamp.getTime(),
    rallyDetails: ann?.rallyDetails ?? null,
    rallyLength: ann?.rallyLength ?? 0,
    firstFaultDetail: ann?.firstFaultDetail ?? null,
  };
}

function mergeWithPointLog(p: TimelinePoint, log: PointLogRow, pointNumber: number): TimelinePoint {
  const ann = log.annotations;
  const rallyDetails = ann?.rallyDetails ?? p.rallyDetails ?? null;
  const firstFaultDetail = ann?.firstFaultDetail ?? p.firstFault ?? null;
  const rallyLength = ann?.rallyLength ?? p.rallyLength;
  const note = ann?.note ?? (rallyDetails?.note ?? p.note);
  return {
    ...p,
    pointNumber,
    pointId: log.id,
    rallyDetails,
    rallyLength,
    note,
    firstFault: firstFaultDetail,
    hasAudioNote: log.audioNote !== null,
    audioNoteDuration: log.audioNoteDuration ?? undefined,
    pointDetails: {
      ...p.pointDetails,
      rallyDetails,
      rallyLength,
      firstFaultDetail,
    },
  };
}
