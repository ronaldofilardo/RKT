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
    <Section title="Análise de Saque">
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
  return (
    <Section title="Análise de Retorno">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
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

export function PressureSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const { pressure } = stats;
  return (
    <Section title="Pontos de Pressão">
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
