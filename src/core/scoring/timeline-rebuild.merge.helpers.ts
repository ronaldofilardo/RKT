import type { PointDetails, TimelinePoint } from '@/core/scoring/types';
import type { PointLogRow } from './timeline-rebuild';

function getServeFields(log: PointLogRow) {
  return {
    isFirstServe: log.annotations?.isFirstServe ?? true,
    isSecondServe: log.annotations?.isSecondServe ?? false,
  };
}

function getAnnotationFields(log: PointLogRow) {
  return {
    rallyDetails: log.annotations?.rallyDetails ?? null,
    rallyLength: log.annotations?.rallyLength ?? 0,
    firstFaultDetail: log.annotations?.firstFaultDetail ?? null,
  };
}

function getPointAnnotationFields(log: PointLogRow) {
  return { ...getServeFields(log), ...getAnnotationFields(log) };
}

export function getLogPointDetails(log: PointLogRow): PointDetails {
  return {
    winnerId: log.winnerId,
    type: log.type as PointDetails['type'],
    ...getPointAnnotationFields(log),
    isLet: false,
    serverId: log.serverId,
    timestamp: log.timestamp.getTime(),
  };
}

function getMergedRallyDetails(p: TimelinePoint, log: PointLogRow) {
  return log.annotations?.rallyDetails ?? p.rallyDetails ?? null;
}

function getMergedFirstFault(p: TimelinePoint, log: PointLogRow) {
  return log.annotations?.firstFaultDetail ?? p.firstFault ?? null;
}

function getMergedRallyLength(p: TimelinePoint, log: PointLogRow) {
  return log.annotations?.rallyLength ?? p.rallyLength;
}

function getMergedNote(_p: TimelinePoint, log: PointLogRow, rallyDetails: PointDetails['rallyDetails']) {
  // Fonte exclusiva: annotations persistidas no PointLog.
  // NÃO usa p.note como fallback: pode ser residual de ponto anterior.
  if (log.annotations == null) return undefined;
  return log.annotations.note ?? rallyDetails?.note ?? undefined;
}

function getMergedDetails(p: TimelinePoint, log: PointLogRow) {
  const rallyDetails = getMergedRallyDetails(p, log);
  return {
    rallyDetails,
    firstFaultDetail: getMergedFirstFault(p, log),
    rallyLength: getMergedRallyLength(p, log),
    note: getMergedNote(p, log, rallyDetails),
    zone: log.annotations?.zone ?? p.zone,
    stroke: log.annotations?.stroke ?? p.stroke,
    rawAnnotations: log.annotations ? { ...log.annotations } : p.rawAnnotations,
  };
}

export function mergeTimelinePoint(
  p: TimelinePoint,
  log: PointLogRow,
  pointNumber: number,
): TimelinePoint {
  const details = getMergedDetails(p, log);
  return {
    ...p,
    pointNumber,
    pointId: log.id,
    rallyDetails: details.rallyDetails,
    rallyLength: details.rallyLength,
    note: details.note,
    zone: details.zone,
    stroke: details.stroke,
    rawAnnotations: details.rawAnnotations,
    firstFault: details.firstFaultDetail,
    hasAudioNote: log.audioNote !== null,
    audioNoteMime: log.audioNoteMime ?? undefined,
    audioNoteDuration: log.audioNoteDuration ?? undefined,
    pointDetails: {
      ...p.pointDetails,
      rallyDetails: details.rallyDetails,
      rallyLength: details.rallyLength,
      firstFaultDetail: details.firstFaultDetail,
    },
  };
}
