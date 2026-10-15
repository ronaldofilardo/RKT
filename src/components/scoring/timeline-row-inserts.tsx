'use client';

import type { ReactNode } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';

/** Linha "Partida interrompida" exibida antes de uma linha com edição de segmento. */
export function SegmentBreakCell({ segmentBreak }: { segmentBreak: NonNullable<TimelinePoint['segmentBreak']> }) {
  const editedAtLabel = new Date(segmentBreak.editedAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <td colSpan={25} className="text-center py-2 bg-telemetry-alert/10 border-y border-dashed border-telemetry-alert/30">
      <span className="text-[10px] text-telemetry-alert">
        ⏸ Partida interrompida em <strong>{segmentBreak.previousLabel}</strong> · placar ajustado para <strong>{segmentBreak.newLabel}</strong> em {editedAtLabel}
      </span>
    </td>
  );
}

/** Linha "marcação interrompida" exibida quando há gap na numeração de pontos. */
export function GapCell() {
  return (
    <td colSpan={25} className="text-center py-1.5">
      <span className="text-[10px] italic text-telemetry-text-muted/50 border-t border-dashed border-b border-dashed border-white/20 px-2">marcação interrompida</span>
    </td>
  );
}

/** Linha de pontos com uma linha de contexto opcional inserida antes dela. */
export function PointRowWithInsert({ insert, rowClass, ariaLabel, children }: {
  insert: ReactNode;
  rowClass: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <>
      <tr>{insert}</tr>
      <tr className={rowClass} aria-label={ariaLabel}>
        {children}
      </tr>
    </>
  );
}
