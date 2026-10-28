import type { TimelinePoint } from '@/core/scoring/types';

export function classifyStrokeCategory(p: TimelinePoint): string | null {
  const r = p.rallyDetails;
  if (!r) return null;

  const esp = r.golpe_esp?.toLowerCase();
  const golpe = r.golpe?.toLowerCase();
  const lado = ((r as any).lado ?? '').toLowerCase();

  if (esp === 'swing_volley') {
    return lado === 'backhand' || golpe === 'backhand' ? 'svbh' : 'svfh';
  }
  if (esp === 'drop_shot' || golpe === 'deixadinha' || golpe === 'drop') return 'drop';
  if (esp === 'lob' || golpe === 'lob') return 'lob';
  if (esp === 'bate_pronto' || golpe === 'bate_pronto') return 'bate_pronto';
  if (golpe === 'smash') return 'sm';

  if (golpe === 'voleio' || golpe === 'vfh' || golpe === 'vbh') {
    return lado === 'backhand' || golpe === 'vbh' ? 'vbh' : 'vfh';
  }

  if (esp === 'approach' || golpe === 'approach_fh') return 'approach_fh';
  if (esp === 'approach' || golpe === 'approach_bh') return 'approach_bh';

  if (lado === 'backhand' || golpe === 'backhand' || golpe === 'bh') return 'bh';
  if (lado === 'forehand' || golpe === 'forehand' || golpe === 'fh') return 'fh';

  return null;
}
