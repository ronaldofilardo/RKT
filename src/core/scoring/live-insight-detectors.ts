import type { TimelinePoint } from './types';
import { computeShotAnalysis } from '@/core/report/pressure-shot-stats';
import type { TacticalInsight } from './live-tactical-insights.types';

export function detectWingWeakness(
  shotStats: ReturnType<typeof computeShotAnalysis>,
  side: 'player1' | 'player2',
  name: string,
  currentSet: number,
): TacticalInsight | null {
  const unforced = shotStats.unforcedErrors;
  if (unforced < 4) return null;

  const bhErrors = shotStats.backhandStats.unforcedErrors;
  const fhErrors = shotStats.forehandStats.unforcedErrors;

  if (bhErrors >= 3 && bhErrors / unforced >= 0.6) {
    const pct = Math.round((bhErrors / unforced) * 100);
    return {
      id: `bh-weakness-${side}-set${currentSet}`,
      type: 'weakness',
      title: 'Fraqueza no Backhand',
      message: `${name}: ${pct}% dos erros não-forçados no ${currentSet}º set foram de Backhand (${bhErrors} de ${unforced}).`,
      playerSide: side,
      icon: '⚠️',
    };
  }

  if (fhErrors >= 3 && fhErrors / unforced >= 0.6) {
    const pct = Math.round((fhErrors / unforced) * 100);
    return {
      id: `fh-weakness-${side}-set${currentSet}`,
      type: 'weakness',
      title: 'Erros no Forehand',
      message: `${name}: ${pct}% dos erros não-forçados no ${currentSet}º set foram de Forehand (${fhErrors} de ${unforced}).`,
      playerSide: side,
      icon: '⚠️',
    };
  }

  return null;
}

export function detectNetVulnerability(
  shotStats: ReturnType<typeof computeShotAnalysis>,
  side: 'player1' | 'player2',
  name: string,
  currentSet: number,
): TacticalInsight | null {
  if (shotStats.netApproaches < 4) return null;

  const lostNet = shotStats.netApproaches - shotStats.netApproachesWon;
  const lostPct = Math.round((lostNet / shotStats.netApproaches) * 100);
  if (lostPct < 65) return null;

  return {
    id: `net-vulnerability-${side}-set${currentSet}`,
    type: 'opportunity',
    title: 'Vulnerabilidade na Rede',
    message: `${name} perdeu ${lostNet} de ${shotStats.netApproaches} subidas à rede no ${currentSet}º set (${lostPct}% de insucesso).`,
    playerSide: side,
    icon: '🎯',
  };
}

export function detectDoubleFaultAlert(
  currentSetPoints: TimelinePoint[],
  side: 'player1' | 'player2',
  name: string,
  currentSet: number,
): TacticalInsight | null {
  let dfCount = 0;
  for (const pt of currentSetPoints) {
    const isServer =
      (side === 'player1' && pt.server === 'player1') ||
      (side === 'player2' && pt.server === 'player2');
    if (isServer && pt.type === 'DOUBLE_FAULT') {
      dfCount++;
    }
  }

  if (dfCount < 3) return null;

  return {
    id: `df-alert-${side}-set${currentSet}`,
    type: 'alert',
    title: 'Instabilidade no Saque',
    message: `${name} cometeu ${dfCount} duplas faltas no ${currentSet}º set.`,
    playerSide: side,
    icon: '⚡',
  };
}
