import type { TimelinePoint, PointDetails, RallyDetails } from './types';

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
  sequenceNumber: number | null;
  clientEventId: string | null;
  annotations:
    | {
        rallyDetails?: RallyDetails | null;
        rallyLength?: number;
        isFirstServe?: boolean;
        isSecondServe?: boolean;
        firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
        note?: string;
        zone?: string;
        stroke?: string;
      }
    | null;
  hasAudioNote?: boolean;
  audioNoteDuration: number | null;
  audioNoteMime?: string | null;
}

/**
 * Constrói um `PointDetails` mínimo a partir do `PointLogRow` — usado como
 * fallback quando o engine rejeitou o ponto ou quando há inconsistência de
 * dados. Prioriza os `annotations` do PointLog para preservar rallyDetails,
 * firstFaultDetail, etc., garantindo que as anotações detalhadas não se
 * percam mesmo em cenários degenerados.
 */
export function buildPointDetailsFromLog(log: PointLogRow): PointDetails {
  const ann = log.annotations;
  const isServeFinish = log.type === 'ACE' || log.type === 'DOUBLE_FAULT';
  const isDevolucao = ann?.rallyDetails?.situacao === 'devolucao';
  const autoRallyLength = ann?.rallyLength ?? (isServeFinish ? 1 : isDevolucao ? 2 : 0);
  const firstFaultDetail = ann?.firstFaultDetail ?? null;
  const isSecondServe =
    log.type === 'DOUBLE_FAULT' ||
    Boolean(firstFaultDetail) ||
    ann?.isSecondServe === true ||
    ann?.isFirstServe === false;
  const isFirstServe = !isSecondServe;
  return {
    winnerId: log.winnerId,
    type: log.type as PointDetails['type'],
    isFirstServe,
    isSecondServe,
    serverId: log.serverId,
    timestamp: log.timestamp.getTime(),
    rallyDetails: ann?.rallyDetails ?? null,
    rallyLength: autoRallyLength,
    firstFaultDetail,
  };
}

/**
 * Sobrescreve as anotações de um `TimelinePoint` (gerado pelo engine
 * simulado ou pelo history persistido) com os dados frescos do PointLog.
 * O PointLog é a fonte de verdade pós-gravação para rallyDetails, firstFault,
 * note e áudio.
 */
export function mergeWithPointLog(
  p: TimelinePoint,
  log: PointLogRow,
  pointNumber: number,
): TimelinePoint {
  const ann = log.annotations;
  const rallyDetails = ann?.rallyDetails ?? p.rallyDetails ?? null;
  const firstFaultDetail = ann?.firstFaultDetail ?? p.firstFault ?? null;
  const rallyLength = ann?.rallyLength ?? p.rallyLength;

  const isSecondServe =
    log.type === 'DOUBLE_FAULT' ||
    Boolean(firstFaultDetail) ||
    ann?.isSecondServe === true ||
    ann?.isFirstServe === false ||
    p.isSecondServe === true ||
    p.isFirstServe === false;
  const isFirstServe = !isSecondServe;

  // `note` é extraída exclusivamente das annotations persistidas do PointLog:
  // 1. annotations.note (campo raiz — path moderno, adicionado na V2)
  // 2. rallyDetails.note (path legado — nota embutida dentro do rallyDetails)
  // NÃO usamos `p.note` como fallback: o TimelinePoint `p` vem do engine
  // simulado e pode carregar nota residual de um ponto anterior, causando
  // "troca" de observações na tabela.
  const note = ann != null
    ? (ann.note ?? rallyDetails?.note ?? undefined)
    : undefined;

  const firstServeOutcome = log.type === 'ACE' && isFirstServe
    ? 'ace'
    : firstFaultDetail?.errorType === 'out'
      ? 'out'
      : firstFaultDetail?.errorType === 'net'
        ? 'net'
        : null;

  const secondServeOutcome = log.type === 'ACE' && isSecondServe
    ? 'ace'
    : log.type === 'DOUBLE_FAULT'
      ? (rallyDetails?.subtipo2 as 'out' | 'net' | undefined) ?? null
      : null;

  return {
    ...p,
    pointNumber,
    sequenceNumber: log.sequenceNumber ?? pointNumber,
    clientEventId: log.clientEventId ?? undefined,
    recordedAt: log.timestamp.toISOString(),
    zone: ann?.zone,
    stroke: ann?.stroke,
    pointId: log.id,
    rawAnnotations: ann ? { ...ann } : p.rawAnnotations,
    isFirstServe,
    isSecondServe,
    rallyDetails,
    rallyLength,
    note,
    firstFault: firstFaultDetail,
    firstServeOutcome,
    secondServeOutcome,
    hasAudioNote: Boolean(log.hasAudioNote ?? (log.audioNoteDuration != null || log.audioNoteMime != null)),
    audioNoteDuration: log.audioNoteDuration ?? undefined,
    pointDetails: {
      ...p.pointDetails,
      isFirstServe,
      isSecondServe,
      rallyDetails,
      rallyLength,
      firstFaultDetail,
    },
  };
}
