'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import { AudioNotePlayer } from './AudioNotePlayer';

const TD = 'px-1.5 py-1.5 text-[10px]';

const NOTE_PLACEHOLDER = /^SET\s+\d+$/i;

function normalizeNote(note: string): string {
  return note
    .replace(/Match Tie-?break/ig, 'MTB')
    .replace(/Tie-?break/ig, 'TB')
    .replace(/Match Tie-?brake/ig, 'MTB')
    .replace(/Tie-?brake/ig, 'TB');
}

/** Última célula: observação de texto + player de áudio. */
export function NoteCell({ p, matchId }: { p: TimelinePoint; matchId: string }) {
  const hasText = Boolean(p.note) && !NOTE_PLACEHOLDER.test(p.note ?? '');
  return (
    <td className={`${TD} text-telemetry-text-muted whitespace-normal break-words`}>
      <div className="flex flex-col gap-1">
        {hasText && <span>📝 {normalizeNote(p.note ?? '')}</span>}
        {p.hasAudioNote && p.pointId && (
          <AudioNotePlayer matchId={matchId} pointId={p.pointId} durationMs={p.audioNoteDuration} />
        )}
        {!hasText && !p.hasAudioNote ? '–' : null}
      </div>
    </td>
  );
}
