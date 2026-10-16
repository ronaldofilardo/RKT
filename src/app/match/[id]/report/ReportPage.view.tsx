'use client';

import { useState } from 'react';
import type { ReportData } from './report.types';
import { AdvancedStats } from '@/components/report/AdvancedStats';
import { downloadReportCsv } from './report-export';
import { TabBar, type ReportViewTab } from './report-view-tab-bar';
import { ReportHeader } from './report-view-header';
import { ReportStats } from './report-view-stats';
import { IntegrityNotice, ReportTimeline } from './report-view-timeline';

type Props = {
  report: ReportData;
  matchId: string;
  p1Points: number;
  p2Points: number;
  totalPoints: number;
  onContinue: () => void;
  onDashboard: () => void;
};

export function ReportPageView({ report, matchId, p1Points, p2Points, totalPoints, onContinue, onDashboard }: Props) {
  const [activeTab, setActiveTab] = useState<ReportViewTab>('summary');

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <ReportHeader report={report} onContinue={onContinue} onDashboard={onDashboard} onExport={() => downloadReportCsv(report)} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} hasAdvancedStats={!!report.advancedStats} />
        {activeTab === 'summary' && <ReportStats report={report} p1Points={p1Points} p2Points={p2Points} totalPoints={totalPoints} />}
        {activeTab === 'advanced' && report.advancedStats && (
          <AdvancedStats stats={report.advancedStats} player1Name={report.player1.name} player2Name={report.player2.name} />
        )}
        <IntegrityNotice report={report} />
        {activeTab === 'timeline' && <ReportTimeline report={report} matchId={matchId} onContinue={onContinue} />}
      </main>
    </div>
  );
}
