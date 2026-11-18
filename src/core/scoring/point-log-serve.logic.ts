import type { TimelinePoint } from './types';
import type { PointLogRow } from './point-log-row.types';

function resolveIsSecondServe(
  type: string,
  hasFirstFault: boolean,
  ann?: PointLogRow['annotations'],
  p?: TimelinePoint,
): boolean {
  if (type === 'DOUBLE_FAULT' || hasFirstFault) return true;
  if (ann?.isSecondServe === true || ann?.isFirstServe === false) return true;
  return p?.isSecondServe === true || p?.isFirstServe === false;
}

function resolveFirstServeOutcome(
  type: string,
  isFirstServe: boolean,
  errorType?: string,
): 'ace' | 'out' | 'net' | null {
  if (type === 'ACE' && isFirstServe) return 'ace';
  if (errorType === 'out') return 'out';
  if (errorType === 'net') return 'net';
  return null;
}

function resolveSecondServeOutcome(
  type: string,
  isSecondServe: boolean,
  subtipo2?: string,
): 'ace' | 'out' | 'net' | null {
  if (type === 'ACE' && isSecondServe) return 'ace';
  if (type === 'DOUBLE_FAULT') {
    return (subtipo2 as 'out' | 'net' | undefined) ?? null;
  }
  return null;
}

export function resolveServeOutcomes(
  log: PointLogRow,
  ann: PointLogRow['annotations'],
  p: TimelinePoint,
  firstFaultDetail: TimelinePoint['firstFault'],
  rallyDetails: TimelinePoint['rallyDetails'],
) {
  const isSecondServe = resolveIsSecondServe(log.type, Boolean(firstFaultDetail), ann, p);
  const isFirstServe = !isSecondServe;
  const firstServeOutcome = resolveFirstServeOutcome(log.type, isFirstServe, firstFaultDetail?.errorType);
  const secondServeOutcome = resolveSecondServeOutcome(log.type, isSecondServe, rallyDetails?.subtipo2);

  return { isFirstServe, isSecondServe, firstServeOutcome, secondServeOutcome };
}
