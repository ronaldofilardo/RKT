import type { MatchData } from '@/hooks/useScoringHandlers';
import type { TimelinePoint } from '@/core/scoring/types';
import { enrichPointsFromHistory, enrichTimelineWithAudio, type PointLogAudioMeta } from '@/components/scoring/timeline-utils';

export function gamePointToDisplay(point: number): string { if (point === 0) return '0'; if (point === 1) return '15'; if (point === 2) return '30'; if (point === 3) return '40'; if (point === 4) return 'AD'; return String(point); }
export function buildTimeline(engine: { getPointHistory: () => Parameters<typeof enrichPointsFromHistory>[0] } | null, match: MatchData | null, audio: PointLogAudioMeta[]): TimelinePoint[] { if (!engine || !match) return []; return enrichTimelineWithAudio(enrichPointsFromHistory(engine.getPointHistory(), match.player1.id, match.player2.id), audio); }
export async function fetchPointLogAudioMeta(matchId: string, token: string | null): Promise<PointLogAudioMeta[]> { const response = await fetch(`/api/matches/${matchId}/point-logs-meta`, { headers: token ? { authorization: `Bearer ${token}` } : {} }); if (!response.ok) return []; const data = await response.json() as { pointLogs?: PointLogAudioMeta[] }; return data.pointLogs ?? []; }
