import type { TimelinePoint } from '@/core/scoring/types';
import { getGameScoreLabel } from '@/core/scoring/scoring-logic';
import { capitalize } from './timeline-format-labels';

export function getCompactGameScoreLabel(p: TimelinePoint): string {
  const gs = p.gameScore;
  return getGameScoreLabel(gs.player1, gs.player2, p.gameIsDeuce, p.gameAdvantage, p.isTiebreak);
}

export function formatAceOrDf(p: TimelinePoint): string {
  if (p.type === 'ACE') {
    const servePrefix = p.isSecondServe ? '2º' : '1º';
    const parts = [`${servePrefix} ACE`];
    const rd = p.rallyDetails;
    if (rd?.efeito) {
      const efeitoMap: Record<string, string> = { topspin: 'TOP', slice: 'SLI', flat: 'FLA' };
      parts.push(efeitoMap[rd.efeito] ?? rd.efeito.toUpperCase().slice(0, 3));
    }
    if (rd?.direcao) {
      const dirMap: Record<string, string> = { aberto: 'AB', centro: 'CEN', fechado: 'FEC', cruzada: 'CRU', paralela: 'PAR' };
      parts.push(dirMap[rd.direcao] ?? rd.direcao.toUpperCase().slice(0, 3));
    }
    return parts.join('-');
  }
  if (p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_SECOND') {
    const ff = p.firstFault;
    const firstPart = ff
      ? `1o.${ff.serveEffect ? `-${capitalize(ff.serveEffect.slice(0, 3))}` : ''}${ff.direction ? `-${capitalize(ff.direction.slice(0, 3))}` : ''}`
      : '1o.';
    const rd = p.rallyDetails;
    const secondPart = rd
      ? `2o.${rd.efeito ? `-${capitalize(rd.efeito.slice(0, 3))}` : ''}${rd.direcao ? `-${capitalize(rd.direcao.slice(0, 3))}` : ''}`
      : '2o.';
    return `DF: ${firstPart} > ${secondPart}`;
  }
  return '–';
}
