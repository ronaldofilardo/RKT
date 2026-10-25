import type { TimelinePoint } from '@/core/scoring/types';

export const MAX_GAP_SECONDS = 90;

export interface SetDurationStat {
  setNumber: number;
  totalMinutes: number;
  effectiveSeconds: number;
  effectiveMinutes: number;
}

export interface MatchDurationStats {
  totalDurationMinutes: number;
  effectiveDurationSeconds: number;
  effectiveDurationMinutes: number;
  effectiveSecondsPerPoint: number;
  setDurations: SetDurationStat[];
}

function parsePointTimestamp(p: TimelinePoint): number | null {
  if (!p.recordedAt) return null;
  const t = new Date(p.recordedAt).getTime();
  return isNaN(t) ? null : t;
}

export function computeMatchDurations(points: TimelinePoint[]): MatchDurationStats {
  const valid = points.filter(p => parsePointTimestamp(p) !== null);
  if (valid.length < 2) {
    return {
      totalDurationMinutes: 0,
      effectiveDurationSeconds: 0,
      effectiveDurationMinutes: 0,
      effectiveSecondsPerPoint: 0,
      setDurations: [],
    };
  }

  const firstTs = parsePointTimestamp(valid[0])!;
  const lastTs = parsePointTimestamp(valid[valid.length - 1])!;
  const totalDurationMinutes = Math.max(0, Math.round((lastTs - firstTs) / 60000));

  const setMap = new Map<number, { points: TimelinePoint[]; effectiveSec: number }>();
  for (const p of valid) {
    if (!setMap.has(p.setNumber)) setMap.set(p.setNumber, { points: [], effectiveSec: 0 });
    setMap.get(p.setNumber)!.points.push(p);
  }

  let totalEffectiveSeconds = 0;
  let measuredGapsCount = 0;

  for (let i = 0; i < valid.length - 1; i++) {
    const curr = valid[i];
    const next = valid[i + 1];
    if (curr.setNumber !== next.setNumber) continue;

    const gapSec = (parsePointTimestamp(next)! - parsePointTimestamp(curr)!) / 1000;
    if (gapSec > 0 && gapSec <= MAX_GAP_SECONDS) {
      totalEffectiveSeconds += gapSec;
      measuredGapsCount++;
      const sEntry = setMap.get(curr.setNumber);
      if (sEntry) sEntry.effectiveSec += gapSec;
    }
  }

  const setDurations: SetDurationStat[] = [];
  const setNumbers = Array.from(setMap.keys()).sort((a, b) => a - b);

  for (let sIdx = 0; sIdx < setNumbers.length; sIdx++) {
    const sNum = setNumbers[sIdx];
    const sData = setMap.get(sNum)!;
    const sFirstTs = parsePointTimestamp(sData.points[0])!;
    let sLastTs = parsePointTimestamp(sData.points[sData.points.length - 1])!;

    if (sIdx < setNumbers.length - 1) {
      const nextSetFirstPt = setMap.get(setNumbers[sIdx + 1])!.points[0];
      sLastTs = parsePointTimestamp(nextSetFirstPt)!;
    }

    const totalMinutes = Math.max(0, Math.round((sLastTs - sFirstTs) / 60000));
    setDurations.push({
      setNumber: sNum,
      totalMinutes,
      effectiveSeconds: Math.round(sData.effectiveSec),
      effectiveMinutes: Math.round(sData.effectiveSec / 60),
    });
  }

  const effectiveDurationMinutes = Math.round(totalEffectiveSeconds / 60);
  const effectiveSecondsPerPoint = measuredGapsCount > 0 ? totalEffectiveSeconds / measuredGapsCount : 0;

  return {
    totalDurationMinutes,
    effectiveDurationSeconds: Math.round(totalEffectiveSeconds),
    effectiveDurationMinutes,
    effectiveSecondsPerPoint: Math.round(effectiveSecondsPerPoint * 10) / 10,
    setDurations,
  };
}
