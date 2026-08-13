import type {
  TimelinePoint,
  PointDetails,
  RallyDetails,
} from '@/core/scoring/types';

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
 * Estado parcial usado como fallback quando o `history` do `scoreState` está
 * incompleto (ex.: após undos/syncs que descartaram entradas antigas). As
 * colunas de GAME/PONTO ficam como "–" (`null`/0) — perde-se o placar do
 * momento daquele ponto, mas todas as anotações detalhadas (rallyDetails,
 * firstFault, etc.) são preservadas, que é o objetivo do /report.
 */
interface PartialStateBefore {
  setNumber: number;
  gamesScore: { player1: number; player2: number };
  gameScore: { player1: number; player2: number };
  isTiebreak: boolean;
  server: 'player1' | 'player2';
}

/**
 * Reconstrói a timeline completa do relatório a partir dos `PointLog`
 * (fonte imutável e completa de anotações), mesclando com `scoreState.history`
 * quando disponível para preencher cols de GAME/PONTO/SET com stateBefore
 * preciso.
 *
 * Estratégia:
 *  - Se `history` cobrir todos os PointLog (mesma length), usa enrichFromHistory
 *    e enriquece com annotations dos PointLog (caminho nominal).
 *  - Se `history` for MAIS CURTO que PointLog (cenário real — entradas foram
 *    perdidas), reconstrói todos os PointLog como base e overlay com
 *    stateBefore do history para os índices que coincidirem (do fim para o
 *    início, since history costuma conter os últimos N pontos).
 *  - Se `history` faltou completamente, usa stateBefore parcial (DASH) para
 *    todos.
 *
 * Somente `rallyDetails`/`firstFault`/etc. do PointLog são usados — nunca do
 * history — porque o PointLog é a fonte de verdade pós-gravação.
 */
export function rebuildTimelineFromPointLogs(
  history: TimelinePoint[],
  pointLogs: PointLogRow[],
  player1Id: string,
  player2Id: string,
  initialServerId: string,
  historyAlignsFromEnd: boolean = true,
): TimelinePoint[] {
  if (pointLogs.length === 0) return history;

  // Caso 1: history covers everything — apenas merge de pointId/áudio/rallyDetails
  if (history.length >= pointLogs.length) {
    return history.map((p, i) => mergeWithPointLog(p, pointLogs[i], i + 1));
  }

  // Cenário 2/3: PointLog > history. Reconstruir todos os PointLog.
  const offset = historyAlignsFromEnd
    ? pointLogs.length - history.length
    : 0;

  const result: TimelinePoint[] = [];
  for (let i = 0; i < pointLogs.length; i++) {
    const log = pointLogs[i];
    const historyIdx = i - offset;
    const fromHistory = historyIdx >= 0 && historyIdx < history.length ? history[historyIdx] : null;

    const tp = fromHistory ? mergeWithPointLog(fromHistory, log, i + 1) : buildFromPointLogOnly(
      log,
      i + 1,
      player1Id,
      player2Id,
      initialServerId,
    );
    result.push(tp);
  }
  return result;
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

function serverPlayer(serverId: string, player1Id: string): 'player1' | 'player2' {
  return serverId === player1Id ? 'player1' : 'player2';
}

function buildFromPointLogOnly(
  log: PointLogRow,
  pointNumber: number,
  player1Id: string,
  _player2Id: string,
  _initialServerId: string,
): TimelinePoint {
  const ann = log.annotations;
  const winner: 'PLAYER_1' | 'PLAYER_2' =
    log.winnerId === player1Id ? 'PLAYER_1' : 'PLAYER_2';
  const server = serverPlayer(log.serverId, player1Id);
  const rallyDetails = ann?.rallyDetails ?? null;
  const firstFaultDetail = ann?.firstFaultDetail ?? null;
  const rallyLength = ann?.rallyLength ?? 0;
  const note = ann?.note ?? rallyDetails?.note;

  // stateBefore desconhecido — preenche com fallback neutro. As colunas
  // GAME/PONTO/SET/SAQUE de BP/GB/SB não são precisas, mas as anotações
  // detalhadas (SITUAÇÃO/GOLPE/EFEITO/...) preservadas do PointLog.
  const partial: PartialStateBefore = {
    setNumber: 1,
    gamesScore: { player1: 0, player2: 0 },
    gameScore: { player1: 0, player2: 0 },
    isTiebreak: false,
    server,
  };

  const pointDetails: PointDetails = {
    winnerId: log.winnerId,
    type: log.type as PointDetails['type'],
    isFirstServe: ann?.isFirstServe ?? true,
    isSecondServe: ann?.isSecondServe ?? false,
    isLet: false,
    serverId: log.serverId,
    timestamp: log.timestamp.getTime(),
    rallyDetails,
    rallyLength,
    firstFaultDetail,
  };

  return {
    pointNumber,
    winner,
    type: log.type,
    server,
    isFirstServe: ann?.isFirstServe ?? false,
    isSecondServe: ann?.isSecondServe ?? false,
    gameScore: partial.gameScore,
    gamesScore: partial.gamesScore,
    setNumber: partial.setNumber,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength,
    rallyDetails,
    note,
    hasAudioNote: log.audioNote !== null,
    audioNoteDuration: log.audioNoteDuration ?? undefined,
    pointId: log.id,
    isTiebreak: partial.isTiebreak,
    gameIsDeuce: false,
    gameAdvantage: null,
    firstFault: firstFaultDetail,
    pointDetails,
  };
}
