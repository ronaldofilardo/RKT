import type { RallyDetailsWithAttribution } from '@/core/scoring/types';

export interface PointDetailsDoublesInfo {
  player1: { id: string; name: string };
  player1Partner?: { id: string; name: string } | null;
  player2: { id: string; name: string };
  player2Partner?: { id: string; name: string } | null;
  activeServerId?: string | null;
  activeReceiverId?: string | null;
  isDecidingPoint?: boolean;
}

export interface UsePointDetailsModalOptions {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  onConfirm: (
    details: RallyDetailsWithAttribution,
    audio?: { blob: Blob; durationMs: number }
  ) => void;
  onCancel: () => void;
  doubles?: PointDetailsDoublesInfo;
}
