import type { TimelinePoint } from '@/core/scoring/types';
import type { ReportIntegrity } from '@/core/report/report-types';
import type { PointLogRow } from '@/components/scoring/timeline-rebuild';

export type { ReportIntegrity } from '@/core/report/report-types';

export function buildReportIntegrity(pointLogs: PointLogRow[], points: TimelinePoint[]): ReportIntegrity {
  const missingSequenceCount = pointLogs.filter((log) => log.sequenceNumber == null).length;
  const pointsWithoutAnnotationDetails = points.filter((point) => !point.rawAnnotations).length;
  const warnings: string[] = [];
  if (missingSequenceCount > 0) warnings.push(`${missingSequenceCount} ponto(s) usam ordenação legada sem sequência persistida.`);
  if (points.length !== pointLogs.length) warnings.push('A quantidade de pontos reconstruídos diverge da quantidade persistida.');
  if (pointsWithoutAnnotationDetails > 0) warnings.push(`${pointsWithoutAnnotationDetails} ponto(s) não possuem anotações detalhadas.`);
  const status = missingSequenceCount > 0 ? 'LEGACY_SEQUENCE' : pointsWithoutAnnotationDetails > 0 ? 'INCOMPLETE_ANNOTATION' : 'OK';
  return { status, pointLogCount: pointLogs.length, timelinePointCount: points.length, missingSequenceCount, pointsWithoutAnnotationDetails, warnings };
}
