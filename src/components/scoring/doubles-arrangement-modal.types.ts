import type { DoublesArrangement } from '@/core/scoring/types';

export interface PlayerRef {
  id: string;
  name: string;
}

export interface DoublesArrangementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (arrangement: DoublesArrangement) => Promise<void> | void;
  player1: PlayerRef;
  player1Partner: PlayerRef;
  player2: PlayerRef;
  player2Partner: PlayerRef;
  currentArrangement?: DoublesArrangement | null;
  currentSetIndex?: number;
}
