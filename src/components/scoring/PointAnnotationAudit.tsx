import type { TimelinePoint } from '@/core/scoring/types';

interface Props {
  point: TimelinePoint;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '–';
  return String(value);
}

export function PointAnnotationAudit({ point }: Props) {
  const raw = point.rawAnnotations;
  const hasDetails = point.zone || point.stroke || point.rallyDetails?.duracao || point.rallyDetails?.previewBalls !== undefined;
  return (
    <div className="space-y-1">
      {point.note ? <span className="block">📝 {point.note}</span> : null}
      {hasDetails ? (
        <div className="text-[9px] text-gray-500 space-y-0.5">
          {point.zone ? <span className="block">Zona: {formatValue(point.zone)}</span> : null}
          {point.stroke ? <span className="block">Stroke: {formatValue(point.stroke)}</span> : null}
          {point.rallyDetails?.duracao ? <span className="block">Duração: {formatValue(point.rallyDetails.duracao)}</span> : null}
          {point.rallyDetails?.previewBalls !== undefined ? <span className="block">Bolas: {point.rallyDetails.previewBalls}</span> : null}
          <span className="block">Trocas exatas: {point.rallyLength}</span>
        </div>
      ) : null}
      {raw ? (
        <details>
          <summary className="cursor-pointer text-sky-600">Dados brutos</summary>
          <pre className="mt-1 max-w-[240px] overflow-auto whitespace-pre-wrap break-words text-[8px]">{JSON.stringify(raw, null, 2)}</pre>
        </details>
      ) : null}
      {point.hasAudioNote && point.pointId ? <span className="block text-gray-500">Áudio anexado</span> : null}
      {!point.note && !hasDetails && !raw && !point.hasAudioNote ? '–' : null}
    </div>
  );
}
