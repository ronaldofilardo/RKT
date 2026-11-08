// Renderização das linhas de fim de game e de entrada/saída do tiebreak na timeline do report.
import { Fragment } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import { getGameEndInfo } from './timeline.logic';
import { GameEndRow } from './timeline-game-end-row';
import { PointRow } from './timeline-point-row';

import type { TimelineDoublesConfig } from './timeline-row.logic';

// Re-exports de compatibilidade (módulo movido para ./timeline-point-row).
export { PointRow } from './timeline-point-row';
// Re-exports de compatibilidade (helpers movidos para ./timeline-row.logic).
export { getPlayerInitials } from './timeline-row.logic';

interface SetGroupProps {
  setNumber: number;
  points: TimelinePoint[];
  allPoints: TimelinePoint[];
  hasActiveFilters: boolean;
  isLast: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
  doubles?: TimelineDoublesConfig;
  isMatchTb?: boolean;
  /** Bug 7 — games iniciais do set (2 para SHORT_SET_2V2_NO_AD, 0 para os demais). */
  initialGames?: number;
}

/**
 * Linha de banner de Tie-break de set — aparece imediatamente após a linha
 * "Fim do Game" que sinaliza a entrada no tiebreak (ex: 6x6 ou 9x9).
 * Visualmente separado da GameEndRow por ser uma linha de contexto independente,
 * com cor e ícone próprios para facilitar a leitura da timeline.
 */
function TiebreakBannerRow({ colSpan, label, sublabel }: {
  colSpan: number;
  label: string;
  sublabel?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-1.5 text-center bg-telemetry-blue/10 border-y border-telemetry-blue/30"
      >
        <span className="text-[10px] font-bold text-telemetry-blue tracking-wide">
          🎾 {label}
        </span>
        {sublabel && (
          <span className="ml-2 text-[9px] text-telemetry-blue/60 font-normal">{sublabel}</span>
        )}
      </td>
    </tr>
  );
}

export function SetGroup({
  setNumber: _setNumber,
  points,
  hasActiveFilters,
  isLast,
  matchId,
  player1Name,
  player2Name,
  doubles,
  isMatchTb,
  initialGames = 0,
}: SetGroupProps) {
  const colSpan = isMatchTb ? 24 : 25;

  return (
    <>
      {!hasActiveFilters && (
        <tr>
          <td
            colSpan={colSpan}
            aria-label={`Set ${_setNumber}`}
            className={[
              'px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border-y border-white/10',
              // Match Tiebreak decisivo: fundo e cor distintos para sinalizar o formato especial
              isMatchTb
                ? 'text-telemetry-blue bg-telemetry-blue/15 border-telemetry-blue/30'
                : 'text-telemetry-text-primary bg-telemetry-elevated',
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <span>Set {_setNumber}</span>
              {isMatchTb && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-telemetry-blue/20 text-telemetry-blue font-semibold normal-case">
                  Match Tie-break
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
      {points.map((p, i) => {
        const prevPoint = i > 0 ? points[i - 1] : null;
        const nextPoint = i < points.length - 1 ? points[i + 1] : null;
        const hasGap = !hasActiveFilters && prevPoint && p.pointNumber - prevPoint.pointNumber > 1;

        // gamesScore muda → novo game. Também usamos o gameScore como
        // fallback (quando gamesScore é igual mas gameScore zerou, ex.: tiebreak).
        const isFirstPointOfGame =
          i === 0 ||
          prevPoint!.gamesScore.player1 !== p.gamesScore.player1 ||
          prevPoint!.gamesScore.player2 !== p.gamesScore.player2 ||
          (prevPoint!.gameScore.player1 === 0 && prevPoint!.gameScore.player2 === 0);

        const isLastPointOfSet = i === points.length - 1;
        // Em Match Tiebreak decisivo não há "fim de game" entre pontos.
        const gameEnd = (!hasActiveFilters && !isMatchTb)
          ? getGameEndInfo(p, nextPoint, isLastPointOfSet)
          : null;

        const winnerName = gameEnd?.winner === 'PLAYER_1'
          ? (doubles?.player1PartnerName ? `${player1Name} / ${doubles.player1PartnerName}` : player1Name)
          : (doubles?.player2PartnerName ? `${player2Name} / ${doubles.player2PartnerName}` : player2Name);

        return (
          <Fragment key={`${p.setNumber}-${p.pointNumber}`}>
            <PointRow
              point={p}
              hasGap={!!hasGap}
              isLast={isLast && isLastPointOfSet}
              matchId={matchId}
              isFirstPointOfGame={isFirstPointOfGame}
              player1Name={player1Name}
              player2Name={player2Name}
              doubles={doubles}
              isMatchTb={isMatchTb}
              initialGames={initialGames}
            />
            {gameEnd && (
              <>
                <GameEndRow
                  point={p}
                  winnerName={winnerName}
                  winnerSide={gameEnd.winner}
                  gameFinalScore={gameEnd.gameFinalScore}
                  isBreak={gameEnd.isBreak}
                  tiebreakStart={gameEnd.isTiebreakEntry}
                />
                {/* Banner de Tie-break de set regular (ex: 6x6 ou 9x9 no PRO_SET_8).
                    Aparece logo abaixo da linha "Fim do Game" que fecha o último game
                    antes do tiebreak, sinalizando claramente a transição. */}
                {gameEnd.isTiebreakEntry && !hasActiveFilters && (
                  <TiebreakBannerRow
                    colSpan={colSpan}
                    label="Tie-break"
                    sublabel={`${gameEnd.gameFinalScore.player1}x${gameEnd.gameFinalScore.player2} games`}
                  />
                )}
              </>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
