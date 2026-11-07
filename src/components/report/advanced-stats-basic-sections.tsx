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
      <StatRow label="Duplas Faltas" p1={serve.player1.doubleFaults} p2={serve.player2.doubleFaults} tone="error" />
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
      <StatRow label="% Devolução 1º saque em quadra" p1={p1.firstServeReturnInPct ?? 0} p2={p2.firstServeReturnInPct ?? 0} format="pct" />
      <StatRow label="% pontos ganhos na devolução de 1º saque" p1={p1.firstServeReturnPointsWonPct ?? 0} p2={p2.firstServeReturnPointsWonPct ?? 0} format="pct" />
      <StatRow label="% dev 2º saque em quadra" p1={p1.secondServeReturnInPct ?? 0} p2={p2.secondServeReturnInPct ?? 0} format="pct" />
      <StatRow label="% pontos ganhos na dev 2º saque" p1={p1.secondServeReturnPointsWonPct ?? 0} p2={p2.secondServeReturnPointsWonPct ?? 0} format="pct" />
      <StatRow label="Games ganhos devolvendo" p1={`${p1.returnGamesWon}/${p1.returnGamesPlayed}`} p2={`${p2.returnGamesWon}/${p2.returnGamesPlayed}`} />
    </Section>
  );
}

export function PressureSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const { pressure } = stats;
  return (
    <Section title="6. Pontos de Pressão">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow label="Games Points Won" p1={`${pressure.player1.gamePointsWon}/${pressure.player1.gamePointsTotal}`} p2={`${pressure.player2.gamePointsWon}/${pressure.player2.gamePointsTotal}`} />
      <StatRow label="% Games Points Won" p1={pressure.player1.gamePointsWonPct} p2={pressure.player2.gamePointsWonPct} format="pct" />
      <StatRow label="Set Points Won" p1={`${pressure.player1.setPointsWon}/${pressure.player1.setPointsTotal}`} p2={`${pressure.player2.setPointsWon}/${pressure.player2.setPointsTotal}`} />
      <StatRow label="% Set Points Won" p1={pressure.player1.setPointsWonPct} p2={pressure.player2.setPointsWonPct} format="pct" />
      <StatRow label="Tiebreaks Won" p1={`${pressure.player1.tiebreaksWon}/${pressure.player1.tiebreaksPlayed}`} p2={`${pressure.player2.tiebreaksWon}/${pressure.player2.tiebreaksPlayed}`} />
      <StatRow label="Total de Pontos Ganhos" p1={pressure.player1.totalPointsWon} p2={pressure.player2.totalPointsWon} />
    </Section>
  );
}
