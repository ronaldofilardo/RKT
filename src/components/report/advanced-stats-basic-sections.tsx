'use client';

import {
  PlayerColumnHeader,
  Section,
  StatRow,
  type AdvancedStatsSectionProps,
} from './advanced-stats-primitives';

export function ServeSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const { serve } = stats;
  return (
    <Section title="1. Saque">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
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

export function ReturnSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const { returnStats } = stats;
  const p1 = returnStats.player1;
  const p2 = returnStats.player2;

  return (
    <Section title="2. Devolução">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow label="Total Break points" p1={p1.breakPointOpportunities} p2={p2.breakPointOpportunities} />
      <StatRow label="Break points Won" p1={p1.breakPointsConverted} p2={p2.breakPointsConverted} />
      <StatRow label="% Saques quebrados" p1={p1.breakPointsConvertedPct} p2={p2.breakPointsConvertedPct} format="pct" />
      <StatRow label="% Devoluções em quadra (1º)" p1={p1.firstServeReturnInPct ?? 0} p2={p2.firstServeReturnInPct ?? 0} format="pct" />
      <StatRow label="% Devoluções em quadra (2º)" p1={p1.secondServeReturnInPct ?? 0} p2={p2.secondServeReturnInPct ?? 0} format="pct" />
      <StatRow label="Pontos ganhos devolvendo" p1={`${p1.returnPointsWon ?? p1.firstServeReturnPointsWon}/${p1.totalReturnPoints ?? p1.totalPoints}`} p2={`${p2.returnPointsWon ?? p2.firstServeReturnPointsWon}/${p2.totalReturnPoints ?? p2.totalPoints}`} />
      <StatRow label="% Pontos ganhos devolvendo" p1={p1.returnPointsWonPct ?? 0} p2={p2.returnPointsWonPct ?? 0} format="pct" />
      <StatRow label="Games de Retorno" p1={`${p1.returnGamesWon}/${p1.returnGamesPlayed}`} p2={`${p2.returnGamesWon}/${p2.returnGamesPlayed}`} />
      <StatRow label="% Games de Retorno" p1={p1.returnGamesWonPct} p2={p2.returnGamesWonPct} format="pct" />
    </Section>
  );
}

export function PressureSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const { pressure } = stats;
  return (
    <Section title="6. Pontos de Pressão">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow label="Game Points" p1={`${pressure.player1.gamePointsWon}/${pressure.player1.gamePointsTotal}`} p2={`${pressure.player2.gamePointsWon}/${pressure.player2.gamePointsTotal}`} />
      <StatRow label="% Game Points" p1={pressure.player1.gamePointsWonPct} p2={pressure.player2.gamePointsWonPct} format="pct" />
      <StatRow label="Set Points" p1={`${pressure.player1.setPointsWon}/${pressure.player1.setPointsTotal}`} p2={`${pressure.player2.setPointsWon}/${pressure.player2.setPointsTotal}`} />
      <StatRow label="% Set Points" p1={pressure.player1.setPointsWonPct} p2={pressure.player2.setPointsWonPct} format="pct" />
      <StatRow label="Tiebreaks" p1={`${pressure.player1.tiebreaksWon}/${pressure.player1.tiebreaksPlayed}`} p2={`${pressure.player2.tiebreaksWon}/${pressure.player2.tiebreaksPlayed}`} />
      <StatRow label="Total de Pontos Ganhos" p1={pressure.player1.totalPointsWon} p2={pressure.player2.totalPointsWon} />
    </Section>
  );
}
