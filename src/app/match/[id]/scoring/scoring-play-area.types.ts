import type { LiveMatchCounters, TacticalInsight } from '@/core/scoring/live-tactical-insights';
import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageDerived } from './useScoringPageDerived';

export interface ScoringPlayAreaProps {
  match: NonNullable<ScoringPageState["match"]>;
  effectiveScoreState: ScoringPageDerived["effectiveScoreState"];
  suspendedSession: ScoringPageState["suspendedSession"];
  liveCounters: LiveMatchCounters;
  tacticalInsights: TacticalInsight[];
  completedSetsCount: number;
  p1IsServing: boolean;
  p2IsServing: boolean;
  activeServerId?: string | null;
  activeReceiverId?: string | null;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  isMatchPoint: boolean;
  isTiebreak: boolean;
  isSuperTiebreak: boolean;
  winner: string | null;
  pointsHistory: ScoringPageState["pointsHistory"];
  scoreState: ScoringPageState["scoreState"];
  isFinished: boolean;
  matchId: string;
  /** Ace/Out/Net (+ painel inline), renderizados sob o card do sacador. */
  serverControls?: React.ReactNode;
  /** Painel de detalhes aberto: libera altura recolhendo blocos secundários. */
  isServePanelOpen?: boolean;
  onOpenSetSummary: () => void;
  onPoint: (side: "player1" | "player2") => void;
  onSwipeUndo: () => void;
  onNavigateReport: () => void;
  onRegisterAndExit: () => Promise<void>;
}
