import type { PointDetails } from './types';
import type { PointLogRow } from './point-log-row.types';

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
    receiverId: log.receiverId ?? ann?.receiverId ?? undefined,
    courtSide: (log.courtSide ?? ann?.courtSide ?? undefined) as 'deuce' | 'ad' | undefined,
    hitterId: log.hitterId ?? ann?.hitterId ?? undefined,
  };
}
