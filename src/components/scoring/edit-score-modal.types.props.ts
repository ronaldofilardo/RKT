import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import type { CompletedSet } from '@/core/scoring/edit-score-state';

export type Player = 'player1' | 'player2';

export interface EditScoreModalProps {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: Player;
  // Sacador do Game 1 de TODA a partida (fixo — normalmente derivado de
  // match.initialServerId). Usado como âncora para recalcular corretamente
  // o sacador do próximo set ao editar o placar. Se omitido, cai para
  // currentServer (comportamento anterior).
  initialServer?: Player;
  completedSets?: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  // Indica que currentGamePoints representa os pontos de um tie-break de
  // set já em andamento (e não os pontos de um game normal), para que o
  // modal pré-preencha o campo "Tie-Break" em vez de "Pontos no Game Atual".
  isTiebreak?: boolean;
  floorCurrentSets?: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  onConfirm: (setResults: SetEditData[], server: Player) => void | Promise<void>;
  onCancel: () => void;
  onMatchFinished?: (winner: 'player1' | 'player2') => void;
  suspendedSession?: {
    bankScoreState?: {
      sets?: Array<{
        player1: number;
        player2: number;
        isTiebreak: boolean;
        tiebreakScore?: { player1: number; player2: number } | null;
      }>;
    } | null;
  } | null;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
  doubles?: {
    player1PartnerName?: string;
    player2PartnerName?: string;
  };
}
