import type { ScoringEngine } from '@/core/scoring/engine';
import type { MatchDataWithSequence } from './useScoringHandlers.match-fetch.types';

/**
 * Sincroniza os badges de pontuação recente a partir do histórico do engine
 * (restaurado) ou dos `recentWinnerIds` devolvidos pelo servidor.
 */
export function syncRecentBadges(
  engineRef: React.MutableRefObject<ScoringEngine | null>,
  data: MatchDataWithSequence,
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>,
): void {
  if (!engineRef.current) return;
  // Lê do engine com histórico restaurado ou do recente de PointLogs do servidor
  const engineHistory = engineRef.current.getPointHistory();
  const synced = engineHistory.slice(-20).map((entry) => entry.point.winnerId);
  const serverRecent = Array.isArray(data.recentWinnerIds) ? data.recentWinnerIds : [];
  const finalBadges = synced.length > 0 ? synced : serverRecent;
  setPointsHistory(finalBadges.length > 0 ? finalBadges : []);
}
