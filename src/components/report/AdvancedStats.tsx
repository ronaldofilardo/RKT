'use client';

import type { AdvancedStatsSectionProps } from './advanced-stats-primitives';
import { ShotSection } from './advanced-stats-shot-section';
import { MomentumSection } from './advanced-stats-momentum';
import { SetBreakdownSection } from './advanced-stats-set-breakdown';
import { ServeSection, ReturnSection, PressureSection } from './advanced-stats-basic-sections';

type Props = AdvancedStatsSectionProps;

export function AdvancedStats({ stats, player1Name, player2Name }: Props) {
  return (
    <div className="space-y-4">
      <ServeSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <ReturnSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <PressureSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <ShotSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <MomentumSection stats={stats} />
      <SetBreakdownSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
    </div>
  );
}
