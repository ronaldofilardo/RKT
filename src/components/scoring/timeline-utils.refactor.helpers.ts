import type { TimelinePoint } from '@/core/scoring/types';
import type { RallyDetails } from '@/schemas/contracts';

type TimelineFilters = {
  playerWinner?: 'PLAYER_1' | 'PLAYER_2';
  breakPointsOnly?: boolean;
  winnersOnly?: boolean;
  acesOnly?: boolean;
  forcedErrorsOnly?: boolean;
  unforcedErrorsOnly?: boolean;
  doubleFaultsOnly?: boolean;
  errorsOnly?: boolean;
};

export function matchesTimelineFilters(p: TimelinePoint, filters: TimelineFilters): boolean {
  const checks = [
    !filters.playerWinner || p.winner === filters.playerWinner,
    !filters.breakPointsOnly || p.isBreakPoint,
    !filters.winnersOnly || p.type === 'WINNER' || p.type === 'ACE',
    !filters.acesOnly || p.type === 'ACE',
    !filters.forcedErrorsOnly || p.type === 'FORCED_ERROR',
    !filters.unforcedErrorsOnly || p.type === 'UNFORCED_ERROR',
    !filters.doubleFaultsOnly || p.type === 'DOUBLE_FAULT',
    !filters.errorsOnly || isErrorType(p.type),
  ];
  return checks.every(Boolean);
}

function isErrorType(type: string): boolean {
  return type === 'UNFORCED_ERROR' || type === 'FORCED_ERROR' || type === 'DOUBLE_FAULT';
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
