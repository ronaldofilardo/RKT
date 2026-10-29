import { buildEngineConfig, type MatchLikeForEngine } from '@/core/scoring/engine-config';
import { rebuildTimelineFromPointLogs, type PointLogRow } from '@/core/scoring/timeline-rebuild';
import type { TimelinePoint } from '@/core/scoring/types';
import { computeScoreAfterLabels } from '@/core/spectate';

export interface SpectatorPointMeta {
  scoreAfter: string;
  setNumber: number;
  gameNumber: number;
  isBreakPoint: boolean;
}

/**
 * Reconstrói a timeline (mesma simulação do relatório) para obter set, game e
 * placar real de cada ponto. Qualquer falha devolve mapa vazio: o feed continua
 * funcionando, só sem o placar por ponto.
 */
export async function loadSpectatorPointMeta(
  match: { id: string },
  pointLogs: unknown[],
  finalGame: { player1: string; player2: string },
  scoreEdits: Parameters<typeof rebuildTimelineFromPointLogs>[6] = [],
): Promise<Map<string, SpectatorPointMeta>> {
  const result = new Map<string, SpectatorPointMeta>();
  if (pointLogs.length === 0) return result;

  try {
    const cfg = buildEngineConfig(match as unknown as MatchLikeForEngine);
    const timeline: TimelinePoint[] = rebuildTimelineFromPointLogs(
      [],
      pointLogs as unknown as PointLogRow[],
      cfg.player1Id,
      cfg.player2Id,
      cfg.initialServerId,
      cfg.format,
      scoreEdits,
      cfg.doubles,
    );

    const labels = computeScoreAfterLabels(timeline, finalGame);
    timeline.forEach((t, i) => {
      const id = t.pointId ?? (pointLogs[i] as { id?: string } | undefined)?.id;
      if (!id) return;
      result.set(id, {
        scoreAfter: labels[i],
        setNumber: t.setNumber,
        gameNumber: t.gamesScore.player1 + t.gamesScore.player2 + 1,
        isBreakPoint: Boolean(t.isBreakPoint),
      });
    });
  } catch {
    return new Map();
  }
  return result;
}
