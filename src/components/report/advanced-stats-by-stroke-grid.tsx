'use client';

import { usePlayerColors } from '@/components/ui/player-color.context';

/** Blocos de um tipo de golpe por atleta; 'error' reserva o vermelho para falha real. */
export function ByStrokeGrid({ title, p1, p2, tone = 'default' }: {
  title: string;
  p1: Record<string, number>;
  p2: Record<string, number>;
  tone?: 'default' | 'error';
}) {
  const colors = usePlayerColors();
  if (Object.keys(p1).length === 0 && Object.keys(p2).length === 0) return null;
  const p1Class = tone === 'error'
    ? 'bg-telemetry-error/10 text-telemetry-error'
    : `bg-white/5 ${colors.p1}`;
  const p2Class = tone === 'error'
    ? 'bg-telemetry-error/10 text-telemetry-error'
    : `bg-white/5 ${colors.p2}`;
  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="text-xs font-semibold text-telemetry-text-primary mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(p1).map(([stroke, count]) => (
          <div key={stroke} className={`flex justify-between rounded px-2 py-1 ${p1Class}`}>
            <span>{stroke.toUpperCase()}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
        <div className="col-span-2 border-t border-white/10" aria-hidden="true" />
        {Object.entries(p2).map(([stroke, count]) => (
          <div key={stroke} className={`flex justify-between rounded px-2 py-1 ${p2Class}`}>
            <span>{stroke.toUpperCase()}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
