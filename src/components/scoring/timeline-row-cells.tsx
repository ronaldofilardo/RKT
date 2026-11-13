'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import { usePlayerColors } from '@/components/ui/player-color.context';
import { direcaoLabel, efeitoLabel, golpeEspLabel, golpeLabel, duracaoLabel, situacaoLabel, subtipo1Label, subtipo2Label } from './timeline.logic';
import { BADGE_COLORS, getGameScoreLabelForPoint, getPointBadge } from './timeline-row.logic';
import { TD, MUTED } from './timeline-row-serve-cells';

// Re-exports de compatibilidade (módulo movido para ./timeline-row-serve-cells).
export { ServeOutcomeCells } from './timeline-row-serve-cells';

/** 5 células (ou 4 em MT): no., SAC, Venc, GAMES (opcional em MT) e PONTOS. */
export function IdentityCells({ p, serverInitials, winnerInitials, isFirstPointOfGame, isMatchTb, serverNumber, winnerNumber, initialGames = 0 }: {
  p: TimelinePoint;
  serverInitials: string;
  winnerInitials: string;
  isFirstPointOfGame: boolean;
  isMatchTb?: boolean;
  /** 1 | 2 — define a cor da célula SAC (cor do atleta, como no card). */
  serverNumber: number;
  /** 1 | 2 — define a cor da célula Venc (cor do atleta, como no card). */
  winnerNumber: number;
  /**
   * Bug 7 — games iniciais do set (2 para SHORT_SET_2V2_NO_AD, 0 para os demais).
   * Necessário para calcular o número ordinal do game corretamente quando o set
   * não começa em 0x0 (ex: SHORT_SET começa em 2x2, então o 1º game é o de número
   * 2+2+1=5 sem o fix, mas deve ser 1).
   */
  initialGames?: number;
}) {
  const colors = usePlayerColors();
  return (
    <>
      <td className={`${TD} text-telemetry-text-primary font-semibold sticky left-0 bg-telemetry-base z-10 border-r border-white/10`}>
        {p.pointNumber}
      </td>
      <td className={`${TD} text-center font-semibold ${serverNumber === 1 ? colors.p1 : colors.p2}`}>
        {serverInitials}
      </td>
      <td className={`${TD} text-center font-bold ${winnerNumber === 1 ? colors.p1 : colors.p2}`}>
        {winnerInitials}
      </td>
      {!isMatchTb && (
        <td className={`${TD} text-telemetry-text-primary font-semibold text-center`}>
          {p.isTiebreak
            // Durante tiebreak: gamesScore contém os games reais (ex: 6x6 ou 9x9).
            ? `${p.gamesScore.player1}x${p.gamesScore.player2}`
            // Jogo regular: exibe o número ordinal do game.
            // Bug 7: subtrai os games iniciais do set para que SHORT_SET_2V2_NO_AD
            // (que começa em 2x2) exiba "1", "2", "3"... em vez de "5", "6", "7"...
            : isFirstPointOfGame
              ? p.gamesScore.player1 + p.gamesScore.player2 + 1 - 2 * initialGames
              : '–'}
        </td>
      )}
      <td className={`${TD} font-bold text-telemetry-text-primary text-center`}>{getGameScoreLabelForPoint(p)}</td>
    </>
  );
}

/** 9 células de detalhe do rally (situação → duração), com badge do tipo de ponto. */
export function RallyDetailCells({ p, isServeDecidedPoint }: {
  p: TimelinePoint;
  isServeDecidedPoint: boolean;
}) {
  const rd = p.rallyDetails;
  const badge = getPointBadge(p);
  const dash = (label: string) => (isServeDecidedPoint ? '–' : label);
  return (
    <>
      <td className={MUTED}>{dash(situacaoLabel(rd?.situacao))}</td>
      <td className={`${TD} border-l border-white/10`}>
        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${BADGE_COLORS[badge.color]}`}>
          {badge.label}
        </span>
      </td>
      <td className={MUTED}>{dash(subtipo1Label(rd?.subtipo1))}</td>
      <td className={MUTED}>{dash(subtipo2Label(rd?.subtipo2))}</td>
      <td className={MUTED}>{dash(golpeLabel(rd?.golpe))}</td>
      <td className={MUTED}>{dash(efeitoLabel(rd?.efeito))}</td>
      <td className={MUTED}>{dash(direcaoLabel(rd?.direcao))}</td>
      <td className={MUTED}>{dash(golpeEspLabel(rd?.golpe_esp))}</td>
      <td className={`${TD} text-telemetry-text-muted/70`}>{duracaoLabel(rd?.duracao)}</td>
    </>
  );
}

export { NoteCell } from './timeline-row-note-cell';
