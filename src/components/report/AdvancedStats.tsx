'use client';

import type { AdvancedMatchStats } from '@/core/report/compute-stats';

interface Props {
  stats: AdvancedMatchStats;
  player1Name: string;
  player2Name: string;
}

function StatRow({ label, p1, p2, format = 'number' }: {
  label: string;
  p1: number | string;
  p2: number | string;
  format?: 'number' | 'pct';
}) {
  const fmt = (v: number | string) => format === 'pct' ? `${Number(v).toFixed(1)}%` : String(v);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-1 border-b border-gray-100 last:border-0">
      <span className="text-right font-mono text-sm text-blue-700">{fmt(p1)}</span>
      <span className="text-xs text-gray-500 text-center min-w-[120px]">{label}</span>
      <span className="font-mono text-sm text-red-700">{fmt(p2)}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ServeSection({ stats, player1Name, player2Name }: Props) {
  const { serve } = stats;
  return (
    <Section title="Análise de Saque">
      <div className="grid grid-cols-[1fr_120px_1fr] gap-1 text-xs text-gray-500 mb-2 px-1">
        <span className="text-right">{player1Name}</span>
        <span></span>
        <span>{player2Name}</span>
      </div>
      <StatRow label="1º Saque (%)" p1={serve.player1.firstServePct} p2={serve.player2.firstServePct} format="pct" />
      <StatRow label="Pts ganhos 1º Saque" p1={serve.player1.firstServePointsWonPct} p2={serve.player2.firstServePointsWonPct} format="pct" />
      <StatRow label="Pts ganhos 2º Saque" p1={serve.player1.secondServePointsWonPct} p2={serve.player2.secondServePointsWonPct} format="pct" />
      <StatRow label="Aces" p1={serve.player1.aces} p2={serve.player2.aces} />
      <StatRow label="Duplas Faltas" p1={serve.player1.doubleFaults} p2={serve.player2.doubleFaults} />
      <StatRow label="Games de Saque" p1={`${serve.player1.serviceGamesWon}/${serve.player1.serviceGamesPlayed}`} p2={`${serve.player2.serviceGamesWon}/${serve.player2.serviceGamesPlayed}`} />
      <StatRow label="% Games de Saque" p1={serve.player1.serviceGamesWonPct} p2={serve.player2.serviceGamesWonPct} format="pct" />
      <StatRow label="Break Points Defendidos" p1={`${serve.player1.breakPointsSaved}/${serve.player1.breakPointsFaced}`} p2={`${serve.player2.breakPointsSaved}/${serve.player2.breakPointsFaced}`} />
      <StatRow label="% BP Defendidos" p1={serve.player1.breakPointsSavedPct} p2={serve.player2.breakPointsSavedPct} format="pct" />
    </Section>
  );
}

function ReturnSection({ stats, player1Name, player2Name }: Props) {
  const { returnStats } = stats;
  return (
    <Section title="Análise de Retorno">
      <div className="grid grid-cols-[1fr_120px_1fr] gap-1 text-xs text-gray-500 mb-2 px-1">
        <span className="text-right">{player1Name}</span>
        <span></span>
        <span>{player2Name}</span>
      </div>
      <StatRow label="Pts ganhos retorno 1º Saque" p1={returnStats.player1.firstServeReturnPointsWonPct} p2={returnStats.player2.firstServeReturnPointsWonPct} format="pct" />
      <StatRow label="Pts ganhos retorno 2º Saque" p1={returnStats.player1.secondServeReturnPointsWonPct} p2={returnStats.player2.secondServeReturnPointsWonPct} format="pct" />
      <StatRow label="Games de Retorno" p1={`${returnStats.player1.returnGamesWon}/${returnStats.player1.returnGamesPlayed}`} p2={`${returnStats.player2.returnGamesWon}/${returnStats.player2.returnGamesPlayed}`} />
      <StatRow label="% Games de Retorno" p1={returnStats.player1.returnGamesWonPct} p2={returnStats.player2.returnGamesWonPct} format="pct" />
      <StatRow label="Oportunidades de Break" p1={returnStats.player1.breakPointOpportunities} p2={returnStats.player2.breakPointOpportunities} />
      <StatRow label="Breaks Convertidos" p1={`${returnStats.player1.breakPointsConverted}/${returnStats.player1.breakPointOpportunities}`} p2={`${returnStats.player2.breakPointsConverted}/${returnStats.player2.breakPointOpportunities}`} />
      <StatRow label="% Conversão de Break" p1={returnStats.player1.breakPointsConvertedPct} p2={returnStats.player2.breakPointsConvertedPct} format="pct" />
    </Section>
  );
}

function PressureSection({ stats, player1Name, player2Name }: Props) {
  const { pressure } = stats;
  return (
    <Section title="Pontos de Pressão">
      <div className="grid grid-cols-[1fr_120px_1fr] gap-1 text-xs text-gray-500 mb-2 px-1">
        <span className="text-right">{player1Name}</span>
        <span></span>
        <span>{player2Name}</span>
      </div>
      <StatRow label="Game Points" p1={`${pressure.player1.gamePointsWon}/${pressure.player1.gamePointsTotal}`} p2={`${pressure.player2.gamePointsWon}/${pressure.player2.gamePointsTotal}`} />
      <StatRow label="% Game Points" p1={pressure.player1.gamePointsWonPct} p2={pressure.player2.gamePointsWonPct} format="pct" />
      <StatRow label="Set Points" p1={`${pressure.player1.setPointsWon}/${pressure.player1.setPointsTotal}`} p2={`${pressure.player2.setPointsWon}/${pressure.player2.setPointsTotal}`} />
      <StatRow label="% Set Points" p1={pressure.player1.setPointsWonPct} p2={pressure.player2.setPointsWonPct} format="pct" />
      <StatRow label="Tiebreaks" p1={`${pressure.player1.tiebreaksWon}/${pressure.player1.tiebreaksPlayed}`} p2={`${pressure.player2.tiebreaksWon}/${pressure.player2.tiebreaksPlayed}`} />
      <StatRow label="Total de Pontos Ganhos" p1={pressure.player1.totalPointsWon} p2={pressure.player2.totalPointsWon} />
    </Section>
  );
}

function ShotSection({ stats, player1Name, player2Name }: Props) {
  const { shots } = stats;
  return (
    <Section title="Análise de Lances">
      <div className="grid grid-cols-[1fr_120px_1fr] gap-1 text-xs text-gray-500 mb-2 px-1">
        <span className="text-right">{player1Name}</span>
        <span></span>
        <span>{player2Name}</span>
      </div>
      <StatRow label="Winners" p1={shots.player1.winners} p2={shots.player2.winners} />
      <StatRow label="Erros Forçados" p1={shots.player1.forcedErrors} p2={shots.player2.forcedErrors} />
      <StatRow label="Erros Não Forçados" p1={shots.player1.unforcedErrors} p2={shots.player2.unforcedErrors} />
      <StatRow label="Aproximações à Rede" p1={`${shots.player1.netApproachesWon}/${shots.player1.netApproaches}`} p2={`${shots.player2.netApproachesWon}/${shots.player2.netApproaches}`} />
      <StatRow label="% Rede" p1={shots.player1.netApproachPct} p2={shots.player2.netApproachPct} format="pct" />
      <StatRow label="Smashes" p1={shots.player1.smashCount} p2={shots.player2.smashCount} />
      <StatRow label="Lobs" p1={shots.player1.lobCount} p2={shots.player2.lobCount} />
      <StatRow label="Drop Shots" p1={shots.player1.dropShotCount} p2={shots.player2.dropShotCount} />

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-600 mb-2">Distribuição de Rally</div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="font-bold text-blue-700">{shots.player1.rallyLengthDistribution.short}</div>
            <div className="text-blue-600">Curtos (1-4)</div>
            <div className="font-bold text-red-700 mt-1">{shots.player2.rallyLengthDistribution.short}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-2">
            <div className="font-bold text-amber-700">{shots.player1.rallyLengthDistribution.medium}</div>
            <div className="text-amber-600">Médios (5-8)</div>
            <div className="font-bold text-red-700 mt-1">{shots.player2.rallyLengthDistribution.medium}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <div className="font-bold text-red-700">{shots.player1.rallyLengthDistribution.long}</div>
            <div className="text-red-600">Longos (9+)</div>
            <div className="font-bold text-red-700 mt-1">{shots.player2.rallyLengthDistribution.long}</div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">
          Duração média do rally: <span className="font-mono">{shots.player1.rallyAvgLength.toFixed(1)} vs {shots.player2.rallyAvgLength.toFixed(1)}</span>
        </div>
      </div>

      {Object.keys(shots.player1.winnersByStroke).length > 0 || Object.keys(shots.player2.winnersByStroke).length > 0 ? (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-600 mb-2">Winners por Golpe</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(shots.player1.winnersByStroke).map(([stroke, count]) => (
              <div key={stroke} className="flex justify-between bg-blue-50 rounded px-2 py-1">
                <span className="text-blue-700">{stroke}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
            {Object.entries(shots.player2.winnersByStroke).map(([stroke, count]) => (
              <div key={stroke} className="flex justify-between bg-red-50 rounded px-2 py-1">
                <span className="text-red-700">{stroke}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Section>
  );
}

function MomentumSection({ stats }: { stats: AdvancedMatchStats }) {
  const { momentum } = stats;
  return (
    <Section title="Momentum">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-black text-blue-600">{momentum.longestWinningStreak}</div>
          <div className="text-xs text-blue-700">Sequência Máx. Pontos Ganhos (J1)</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl font-black text-red-600">{momentum.longestLosingStreak}</div>
          <div className="text-xs text-red-700">Sequência Máx. Pontos Ganhos (J2)</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-xs text-gray-500">Sequência atual: </div>
        <div className={`text-lg font-bold ${momentum.currentStreak > 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {momentum.currentStreak > 0 ? `${momentum.currentStreak} pts` : `${Math.abs(momentum.currentStreak)} pts`}
          <span className="text-xs text-gray-500 ml-1">
            {momentum.currentStreak > 0 ? '(J1)' : '(J2)'}
          </span>
        </div>
      </div>
      {momentum.scoringRuns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-600 mb-2">Sequências de 3+ Pontos</div>
          <div className="flex flex-wrap gap-1">
            {momentum.scoringRuns.slice(0, 5).map((run, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  run.player === 'PLAYER_1'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {run.length}x {run.player === 'PLAYER_1' ? 'J1' : 'J2'}
              </span>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function SetBreakdownSection({ stats, player1Name, player2Name }: Props) {
  return (
    <Section title="Breakdown por Set">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-2">Set</th>
              <th className="text-center py-1 px-2">{player1Name}</th>
              <th className="text-center py-1 px-2">{player2Name}</th>
              <th className="text-center py-1 px-2">Pontos</th>
              <th className="text-center py-1 px-2">Aces</th>
              <th className="text-center py-1 px-2">Winners</th>
              <th className="text-center py-1 px-2">Erros</th>
              <th className="text-center py-1 px-2">Duração</th>
            </tr>
          </thead>
          <tbody>
            {stats.setBreakdown.map(set => (
              <tr key={set.setNumber} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-1 px-2 font-semibold">
                  Set {set.setNumber}
                  {set.isTiebreak && <span className="text-amber-600 ml-1">TB</span>}
                </td>
                <td className="text-center py-1 px-2 text-blue-700 font-mono">
                  {set.p1Games}x{set.p2Games}
                </td>
                <td className="text-center py-1 px-2 font-mono">
                  {set.p1Games}x{set.p2Games}
                </td>
                <td className="text-center py-1 px-2 text-blue-700">{set.p1Points}</td>
                <td className="text-center py-1 px-2 text-red-700">{set.p2Points}</td>
                <td className="text-center py-1 px-2">
                  <span className="text-blue-600">{set.p1Aces}</span>
                  <span className="text-gray-400 mx-0.5">/</span>
                  <span className="text-red-600">{set.p2Aces}</span>
                </td>
                <td className="text-center py-1 px-2">
                  <span className="text-blue-600">{set.p1Winners}</span>
                  <span className="text-gray-400 mx-0.5">/</span>
                  <span className="text-red-600">{set.p2Winners}</span>
                </td>
                <td className="text-center py-1 px-2">
                  <span className="text-blue-600">{set.p1Errors}</span>
                  <span className="text-gray-400 mx-0.5">/</span>
                  <span className="text-red-600">{set.p2Errors}</span>
                </td>
                <td className="text-center py-1 px-2 text-gray-500">
                  {set.duration != null ? `${set.duration}min` : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

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
