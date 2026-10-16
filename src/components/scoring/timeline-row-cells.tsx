'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import { direcaoLabel, efeitoLabel, golpeEspLabel, golpeLabel, duracaoLabel, situacaoLabel, subtipo1Label, subtipo2Label } from './timeline.logic';
import { BADGE_COLORS, getGameScoreLabelForPoint, getPointBadge } from './timeline-row.logic';

const TD = 'px-1.5 py-1.5 text-[10px]';
const MUTED = `${TD} text-telemetry-text-muted`;

interface FlagCellProps {
  active: boolean;
  label: string;
  color: string;
}

function FlagCell({ active, label, color }: FlagCellProps) {
  return (
    <td className={`${TD} text-center font-semibold ${active ? color : 'text-telemetry-text-muted/50'}`}>
      {active ? label : '–'}
    </td>
  );
}

/** 5 células: no., SAC, Venc, GAMES e PONTOS. */
export function IdentityCells({ p, serverNumber, winnerNumber, serverInitials, winnerInitials, isFirstPointOfGame }: {
  p: TimelinePoint;
  serverNumber: number;
  winnerNumber: number;
  serverInitials: string;
  winnerInitials: string;
  isFirstPointOfGame: boolean;
}) {
  return (
    <>
      <td className={`${TD} text-telemetry-text-primary font-semibold sticky left-0 bg-telemetry-base z-10 border-r border-white/10`}>
        {p.pointNumber}
      </td>
      <td className={`${TD} text-center font-semibold ${serverNumber === 1 ? 'text-telemetry-blue' : 'text-telemetry-error'}`}>
        {serverInitials}
      </td>
      <td className={`${TD} text-center font-bold ${winnerNumber === 1 ? 'text-telemetry-blue' : 'text-telemetry-error'}`}>
        {winnerInitials}
      </td>
      <td className={`${TD} text-telemetry-text-primary font-semibold text-center`}>
        {p.isTiebreak
          ? `${p.gamesScore.player1}x${p.gamesScore.player2}`
          : isFirstPointOfGame ? p.gamesScore.player1 + p.gamesScore.player2 + 1 : '–'}
      </td>
      <td className={`${TD} font-bold text-telemetry-text-primary`}>{getGameScoreLabelForPoint(p)}</td>
    </>
  );
}

/** 5 células de um saque: ACE, OUT, NET, Efeito e Direção. */
export function ServeOutcomeCells({ outcome, effect, direction }: {
  outcome: string | null | undefined;
  effect: string;
  direction: string;
}) {
  return (
    <>
      <FlagCell active={outcome === 'ace'} label="ACE" color="text-green-400" />
      <FlagCell active={outcome === 'out'} label="OUT" color="text-telemetry-error" />
      <FlagCell active={outcome === 'net'} label="NET" color="text-telemetry-alert" />
      <td className={MUTED}>{effect}</td>
      <td className={MUTED}>{direction}</td>
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
      <td className={`${TD} text-telemetry-text-muted/70`}>{dash(duracaoLabel(rd?.duracao))}</td>
    </>
  );
}

export { NoteCell } from './timeline-row-note-cell';
