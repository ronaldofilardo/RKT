'use client';

import type { ReportData } from '@/app/match/[id]/report/report.types';
import type { AdvancedStatsSectionProps } from './advanced-stats-primitives';
import { AdvancedStatsHeader } from './advanced-stats-header';
import { ServeSection, ReturnSection, PressureSection } from './advanced-stats-basic-sections';
import { BaselineSection } from './advanced-stats-baseline-section';
import { RallySection } from './advanced-stats-rally-section';
import { NetPassSection } from './advanced-stats-net-pass-section';
import { PointDefinitionSection } from './advanced-stats-point-def-section';
import { StrokeMatrixSection } from './advanced-stats-stroke-matrix-section';
import { MomentumSection } from './advanced-stats-momentum';
import { SetBreakdownSection } from './advanced-stats-set-breakdown';
import { DoublesPlayerBreakdownSection } from './advanced-stats-doubles-players';

interface Props extends AdvancedStatsSectionProps {
  report?: ReportData;
}

export function AdvancedStats({ stats, player1Name, player2Name, report }: Props) {
  return (
    <div className="space-y-4">
      {report && (
        <AdvancedStatsHeader
          report={report}
          stats={stats}
          player1Name={player1Name}
          player2Name={player2Name}
        />
      )}
      <ServeSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <ReturnSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <BaselineSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <RallySection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <NetPassSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <PressureSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <PointDefinitionSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <StrokeMatrixSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <MomentumSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <SetBreakdownSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      {report?.matchType === 'DOUBLES' && <DoublesPlayerBreakdownSection report={report} />}
    </div>
  );
}
