'use client';

import type { ReactNode } from 'react';
import { PlayerCard } from '@/components/scoring/PlayerCard';
import type { ScoringPlayAreaProps } from './scoring-play-area.types';

type MatchPlayer = ScoringPlayAreaProps['match']['player1'];

interface PlayAreaPlayersProps {
  player1: MatchPlayer;
  player2: MatchPlayer;
  player1Partner?: MatchPlayer;
  player2Partner?: MatchPlayer;
  activeServerId?: string | null;
  activeReceiverId?: string | null;
  scoreState: ScoringPlayAreaProps['effectiveScoreState'];
  p1IsServing: boolean;
  p2IsServing: boolean;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  winner: string | null;
  isFinished: boolean;
  /** Renderizado apenas na coluna do jogador que está sacando. */
  serverControls?: ReactNode;
  onPoint: (side: 'player1' | 'player2') => void;
  onSwipeUndo: () => void;
  onChangeServer?: () => void;
}

/** Coluna de um jogador: card (encolhe primeiro) + controles de saque opcionais abaixo. */
function PlayerColumn({ controls, children }: { controls?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-1">
      <div className="flex-1 min-h-[96px] max-h-[180px] flex">{children}</div>
      {controls}
    </div>
  );
}

export function PlayAreaPlayers({
  player1, player2, player1Partner, player2Partner, activeServerId, activeReceiverId, scoreState,
  p1IsServing, p2IsServing, isSetPoint, isBreakPoint, winner, isFinished, serverControls, onPoint, onSwipeUndo,
  onChangeServer,
}: PlayAreaPlayersProps) {
  const isZeroZeroGame = Boolean(
    scoreState?.currentGame &&
    scoreState.currentGame.player1 === 0 &&
    scoreState.currentGame.player2 === 0 &&
    !scoreState.currentGame.secondServe &&
    !isFinished
  );

  const shared = {
    scoreState,
    activeServerId,
    activeReceiverId,
    isSetPoint,
    isBreakPoint,
    onSwipeDown: onSwipeUndo,
    disabled: isFinished,
    onChangeServer,
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative z-10 gap-1">
      <div className="flex items-stretch gap-1 sm:gap-2 flex-1 min-h-0">
        <PlayerColumn controls={p1IsServing ? serverControls : null}>
          <PlayerCard {...shared} player={player1} partner={player1Partner} side="player1" isServing={p1IsServing} isWinner={winner === 'player1'} onPoint={() => onPoint('player1')} />
        </PlayerColumn>

        <div className="w-px self-stretch bg-white/10 flex-shrink-0" />

        <PlayerColumn controls={p2IsServing ? serverControls : null}>
          <PlayerCard {...shared} player={player2} partner={player2Partner} side="player2" isServing={p2IsServing} isWinner={winner === 'player2'} onPoint={() => onPoint('player2')} />
        </PlayerColumn>
      </div>

      {isZeroZeroGame && onChangeServer && (
        <div className="flex justify-center -mt-0.5">
          <button
            type="button"
            onClick={onChangeServer}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-telemetry-elevated/80 border border-white/10 text-[11px] font-medium text-telemetry-text-muted hover:text-white hover:bg-telemetry-elevated transition-colors"
            title="Corrigir quem está sacando no game atual"
          >
            <span>🎾</span>
            <span>Corrigir Sacador</span>
          </button>
        </div>
      )}
    </div>
  );
}
