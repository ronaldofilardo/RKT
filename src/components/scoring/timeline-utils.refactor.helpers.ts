import type { TimelinePoint } from '@/core/scoring/types';
import type { RallyDetails } from '@/schemas/contracts';

type TimelineFilters = {
  playerWinner?: 'PLAYER_1' | 'PLAYER_2';
  breakPointsOnly?: boolean;
  winnersOnly?: boolean;
  errorsOnly?: boolean;
};

export function matchesTimelineFilters(p: TimelinePoint, filters: TimelineFilters): boolean {
  if (filters.playerWinner && p.winner !== filters.playerWinner) return false;
  if (filters.breakPointsOnly && !p.isBreakPoint) return false;
  if (filters.winnersOnly && p.type !== 'WINNER' && p.type !== 'ACE') return false;
  if (filters.errorsOnly && !isErrorPoint(p)) return false;
  return true;
}

function isErrorPoint(p: TimelinePoint): boolean {
  return p.type === 'UNFORCED_ERROR'
    || p.type === 'FORCED_ERROR'
    || p.type === 'DOUBLE_FAULT';
}

function formatAceDetails(rd?: RallyDetails | null): string {
  const parts = ['ACE'];
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatServePart(prefix: string, effect?: string, direction?: string): string {
  return `${prefix}${effect ? `-${capitalize(effect.slice(0, 3))}` : ''}${direction ? `-${capitalize(direction.slice(0, 3))}` : ''}`;
}

function formatDoubleFault(p: TimelinePoint): string {
  const ff = p.firstFault;
  const firstPart = ff ? formatServePart('1o.', ff.serveEffect, ff.direction) : '1o.';
  const rd = p.rallyDetails;
  const secondPart = rd ? formatServePart('2o.', rd.efeito, rd.direcao) : '2o.';
  return `DF: ${firstPart} > ${secondPart}`;
}

export function formatAceOrDoubleFault(p: TimelinePoint): string {
  if (p.type === 'ACE') return formatAceDetails(p.rallyDetails);
  if (p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_SECOND') return formatDoubleFault(p);
  return '–';
}
