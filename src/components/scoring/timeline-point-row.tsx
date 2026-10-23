'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import { direcaoLabel, efeitoLabel } from './timeline.logic';
import { type TimelineDoublesConfig } from './timeline-row.logic';
import { resolveServerInitials, resolveWinnerInitials } from './timeline-row-initials.logic';
import { IdentityCells, NoteCell, RallyDetailCells, ServeOutcomeCells } from './timeline-row-cells';
import { GapCell, PointRowWithInsert, SegmentBreakCell } from './timeline-row-inserts';

export interface PointRowProps {
  point: TimelinePoint;
  hasGap: boolean;
  isLast: boolean;
  matchId: string;
  /** Quando true, esta linha é o primeiro ponto do game atual. */
  isFirstPointOfGame: boolean;
  player1Name: string;
  player2Name: string;
  doubles?: TimelineDoublesConfig;
}

export function PointRow({ point: p, hasGap, isLast: _isLast, matchId, isFirstPointOfGame, player1Name, player2Name, doubles }: PointRowProps) {
  const rd = p.rallyDetails;
  const isServeDecidedPoint = p.type === 'ACE' || p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_FIRST';

  const rowClass = [
    'border-b border-white/5 hover:bg-white/5 transition-colors',
    p.winner === 'PLAYER_1' ? 'border-l-[3px] border-l-telemetry-blue' : 'border-l-[3px] border-l-telemetry-error',
    p.isBreakPoint ? 'bg-telemetry-alert/10' : '',
  ].join(' ');

  const ariaLabel = `Ponto: ${p.winner === 'PLAYER_1' ? 'P1' : 'P2'} venceu`;

  const serverNumber = p.server === 'player1' ? 1 : 2;
  const winnerNumber = p.winner === 'PLAYER_1' ? 1 : 2;

  const serverInitials = resolveServerInitials({
    serverNumber,
    pointServerId: p.serverId ?? p.pointDetails?.serverId,
    player1Name,
    player2Name,
    doubles,
  });
  const winnerInitials = resolveWinnerInitials({ winnerNumber, player1Name, player2Name, doubles });

  const firstOutcome = p.firstServeOutcome;
  const secondOutcome = p.secondServeOutcome;

  const cells = (
    <>
      <IdentityCells
        p={p}
        serverNumber={serverNumber}
        winnerNumber={winnerNumber}
        serverInitials={serverInitials}
        winnerInitials={winnerInitials}
        isFirstPointOfGame={isFirstPointOfGame}
      />
      <ServeOutcomeCells
        outcome={firstOutcome}
        effect={firstOutcome === 'ace' ? efeitoLabel(rd?.efeito) : firstOutcome ? efeitoLabel(p.firstFault?.serveEffect) : '–'}
        direction={firstOutcome === 'ace' ? direcaoLabel(rd?.direcao) : firstOutcome ? direcaoLabel(p.firstFault?.direction) : '–'}
      />
      <ServeOutcomeCells
        outcome={secondOutcome}
        effect={secondOutcome ? efeitoLabel(rd?.efeito) : '–'}
        direction={secondOutcome ? direcaoLabel(rd?.direcao) : '–'}
      />
      <RallyDetailCells p={p} isServeDecidedPoint={isServeDecidedPoint} />
      <NoteCell p={p} matchId={matchId} />
    </>
  );

  if (p.segmentBreak) {
    return (
      <PointRowWithInsert insert={<SegmentBreakCell segmentBreak={p.segmentBreak} />} rowClass={rowClass} ariaLabel={ariaLabel}>
        {cells}
      </PointRowWithInsert>
    );
  }

  if (hasGap) {
    return (
      <PointRowWithInsert insert={<GapCell />} rowClass={rowClass} ariaLabel={ariaLabel}>
        {cells}
      </PointRowWithInsert>
    );
  }

  return (
    <tr className={rowClass} aria-label={ariaLabel}>
      {cells}
    </tr>
  );
}
