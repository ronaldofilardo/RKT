import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import type { TennisFormat } from '@/core/scoring/types';
import { formatSpectatorGame, type SpectatorMarker } from '@/core/spectate';

export interface ScoreEditInput {
  editedAt: Date;
  previousScoreState: unknown;
  newScoreState: unknown;
}

export interface PointRef {
  sequenceNumber: number | null;
  timestamp: Date;
}

/** "6-4, 3-2 · game 30-30" — só dados públicos do placar, sem notas. */
export function describeScoreSnapshot(raw: unknown, format?: string): string | null {
  try {
    const n = normalizeScoreState(raw, format as TennisFormat | undefined);
    if (!n) return null;
    const sets = n.sets.map((s) =>
      s.isTiebreak && s.tiebreakScore && s.player1 <= 1 && s.player2 <= 1
        ? `TB ${s.tiebreakScore.player1}-${s.tiebreakScore.player2}`
        : `${s.player1}-${s.player2}`,
    );
    const g = formatSpectatorGame(n.currentGame, null);
    return `${sets.length > 0 ? sets.join(', ') : '0-0'} · game ${g.player1}-${g.player2}`;
  } catch {
    return null;
  }
}

function seqAtEdit(edit: ScoreEditInput): number | null {
  const s = edit.newScoreState as { pointLogSequenceAtEdit?: unknown; state?: { pointLogSequenceAtEdit?: unknown } } | null;
  const v = s?.pointLogSequenceAtEdit ?? s?.state?.pointLogSequenceAtEdit;
  return typeof v === 'number' ? v : null;
}

/**
 * Converte MatchScoreEdit em marcadores públicos da linha do tempo.
 * A nota (observação) da edição NÃO é exposta ao espectador.
 */
export function buildScoreEditMarkers(
  edits: ScoreEditInput[],
  points: PointRef[],
  format?: string,
): SpectatorMarker[] {
  return edits.map((edit) => {
    let afterSeq = seqAtEdit(edit);
    if (afterSeq === null) {
      const editMs = edit.editedAt.getTime();
      afterSeq = 0;
      points.forEach((pt, idx) => {
        if (pt.timestamp.getTime() <= editMs) afterSeq = pt.sequenceNumber ?? idx + 1;
      });
    }
    const from = describeScoreSnapshot(edit.previousScoreState, format);
    const to = describeScoreSnapshot(edit.newScoreState, format);
    return {
      kind: 'SCORE_EDIT' as const,
      at: edit.editedAt.toISOString(),
      description: from && to ? `Placar ajustado manualmente: ${from} → ${to}` : 'Placar ajustado manualmente',
      afterSeq,
      from,
      to,
    };
  });
}
