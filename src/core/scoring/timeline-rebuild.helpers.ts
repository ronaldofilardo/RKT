import type { PointLogRow } from './timeline-rebuild';



export function pointLogToFlow(log: PointLogRow): import('@/core/scoring/types').PointFlow {
  const ann = log.annotations;
  const firstFaultDetail = ann?.firstFaultDetail ?? null;
  const isSecondServe =
    log.type === 'DOUBLE_FAULT' ||
    Boolean(firstFaultDetail) ||
    ann?.isSecondServe === true ||
    ann?.isFirstServe === false;
  const isFirstServe = !isSecondServe;

  return {
    winnerId: log.winnerId,
    type: log.type,
    serverId: log.serverId,
    timestamp: log.timestamp.getTime(),
    isFirstServe,
    isSecondServe,
    firstFault: log.type === 'FAULT_FIRST',
    firstFaultDetail,
    rallyDetails: ann?.rallyDetails ?? null,
    rallyLength: ann?.rallyLength,
  };
}



