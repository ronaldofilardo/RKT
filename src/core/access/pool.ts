import type { Actor } from './types';
import { activeCtIds } from './scope';
import { isMinor } from './age';

/** Escopo efetivo de busca no pool de atletas. */
export type PoolScope = { kind: 'CT' | 'ANY'; ctIds: string[] };

/** Todos os CTs ativos do ator (gestor, treinador ou atleta vinculado via PlayerCT). */
export function actorCtIds(actor: Actor): string[] {
  const gestor = activeCtIds(actor, 'GESTOR');
  const treinador = activeCtIds(actor, 'TREINADOR');
  const atleta = actor.athleteCtIds ?? [];
  return [...new Set([...gestor, ...treinador, ...atleta])];
}

/** Resolve o escopo de busca com base no toggle "Meu clube" e nos CTs do ator. */
export function resolvePoolScope(actor: Actor | null, myClub: boolean): PoolScope {
  const cts = actor ? actorCtIds(actor) : [];
  if (myClub && cts.length > 0) return { kind: 'CT', ctIds: cts };
  return { kind: 'ANY', ctIds: [] };
}

/** Linha minima de Player vinda do banco para montar a view de pool. */
export interface PoolPlayerRow {
  id: string;
  name: string;
  birthDate?: Date | null;
  athleteCode?: string | null;
  club?: string | null;
}

/** View minima de atleta para busca global no pool (dados sensiveis omitidos). */
export interface PoolPlayerView {
  id: string;
  name: string;
  athleteCode?: string | null;
  club?: string | null;
  /** true quando o atleta e menor de idade (dados sensiveis mascarados na UI). */
  minor: boolean;
}

/** Mascara o nome de um menor para busca global (privacidade ECA/LGPD). */
export function maskNameForMinor(name: string): string {
  const first = name.trim().slice(0, 1);
  return first ? `${first}***` : '***';
}

/** Converte uma linha de Player na view minima de pool, aplicando mascaracao de menores. */
export function toPoolPlayerView(row: PoolPlayerRow, now: Date): PoolPlayerView {
  const minor = isMinor(row.birthDate ?? null, now);
  return {
    id: row.id,
    name: minor ? maskNameForMinor(row.name) : row.name,
    athleteCode: minor ? null : row.athleteCode ?? null,
    club: minor ? null : row.club ?? null,
    minor,
  };
}
