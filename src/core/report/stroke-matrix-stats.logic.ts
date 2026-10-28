import type { TimelinePoint } from '@/core/scoring/types';
import type { StrokeMatrixRow } from './report-analysis-matrix.types';
import { classifyStrokeCategory } from './stroke-matrix-classify.logic';

const STROKE_DEFINITIONS: Array<{ code: string; name: string }> = [
  { code: 'sq', name: 'Sq (Saque)' },
  { code: 'fh', name: 'FH (Forehand)' },
  { code: 'bh', name: 'BH (Backhand)' },
  { code: 'vfh', name: 'VFH (Voleio FH)' },
  { code: 'vbh', name: 'VBH (Voleio BH)' },
  { code: 'svfh', name: 'SVFH (Swing Volley FH)' },
  { code: 'svbh', name: 'SVBH (Swing Volley BH)' },
  { code: 'sm', name: 'Sm (Smash)' },
  { code: 'drop', name: 'Drop (Deixadinha)' },
  { code: 'lob', name: 'Lob' },
  { code: 'bate_pronto', name: 'Bate Pronto' },
  { code: 'approach_fh', name: 'Aproach FH' },
  { code: 'approach_bh', name: 'Aproach BH' },
];

export function computeStrokeMatrixStats(
  points: TimelinePoint[],
  player: 'PLAYER_1' | 'PLAYER_2',
): StrokeMatrixRow[] {
  const isServer = player === 'PLAYER_1' ? 'player1' : 'player2';

  const rowMap = new Map<string, { winners: number; forced: number; unforced: number }>();
  for (const def of STROKE_DEFINITIONS) {
    rowMap.set(def.code, { winners: 0, forced: 0, unforced: 0 });
  }

  // Linha Sq: Aces e Duplas Faltas
  const sqEntry = rowMap.get('sq')!;
  sqEntry.winners = points.filter(p => p.server === isServer && p.type === 'ACE').length;
  sqEntry.unforced = points.filter(p => p.server === isServer && p.type === 'DOUBLE_FAULT').length;

  for (const p of points) {
    if (p.type === 'ACE' || p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_FIRST') continue;

    const cat = classifyStrokeCategory(p);
    if (!cat) continue;

    const entry = rowMap.get(cat);
    if (!entry) continue;

    if (p.winner === player) {
      if (p.type === 'WINNER' || p.rallyDetails?.tipo === 'winner') {
        entry.winners++;
      }
    } else {
      if (p.type === 'UNFORCED_ERROR' || p.rallyDetails?.tipo === 'erro_nao_forcado') {
        entry.unforced++;
      } else if (p.type === 'FORCED_ERROR' || p.rallyDetails?.tipo === 'erro_forcado') {
        entry.forced++;
      }
    }
  }

  return STROKE_DEFINITIONS.map(def => {
    const counts = rowMap.get(def.code)!;
    return {
      code: def.code,
      name: def.name,
      winners: counts.winners,
      forcedErrors: counts.forced,
      unforcedErrors: counts.unforced,
      total: counts.winners + counts.forced + counts.unforced,
    };
  });
}
