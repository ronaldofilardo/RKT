/**
 * CHARACTERIZATION TESTS — src/core/access/match-event-visibility.ts
 *
 * Kit de testes de match-event-visibility.characterization.test.ts (não é
 * .test.ts: fica fora da coleta do Jest e não é limitado a 80L). Concentra o
 * arrange: actor()/member() (atores padrão) e tpl()/CT/OTHER_CT (cartaz base).
 *
 * Propósito: Capturar comportamento OBSERVADO do módulo de descoberta de cartazes
 * (eventos) antes de qualquer alteração de regra de acesso.
 * Distinção entre "ver que a partida existe para anotar a própria versão"
 * (acesso ao Cartaz) e "ver a marcação de alguém" (acesso à Anotação).
 *
 * Regras capturadas:
 * - PUBLIC: qualquer usuário ativo autenticado descobre.
 * - PRIVATE_CLUB: staff do CT dono, atleta participante ou responsável de menor.
 * - PRIVATE_COACH: criador, atleta participante ou responsável de menor.
 * - PRIVATE_PLAYERS: apenas atletas diretamente envolvidos (+ responsáveis de menores).
 * - PRIVATE_PERSONAL: apenas o próprio criador.
 */

import type { MatchTemplateAccess } from '../match-event-visibility';
import type { Actor } from '../types';

export function actor(over: Partial<Actor> = {}): Actor {
  return {
    userId: 'u-1',
    isActive: true,
    canOperate: false,
    memberships: [],
    athletePlayerId: null,
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
    activeContextId: undefined,
    activeArea: undefined,
    ...over,
  };
}

export function member(kind: 'PLATAFORMA' | 'GESTOR' | 'TREINADOR', extra: Partial<{ preset?: 'ADMIN' | 'SUPORTE' | null; ctId?: string | null; status: 'ACTIVE' | 'SUSPENDED' | 'ENDED' }> = {}) {
  return { kind, status: 'ACTIVE', ...extra } as any;
}

export const CT = 'ct-1';
export const OTHER_CT = 'ct-2';

export function tpl(over: Partial<MatchTemplateAccess> = {}): MatchTemplateAccess {
  return {
    eventScope: 'PUBLIC',
    createdByUserId: 'creator',
    ctId: CT,
    participantPlayerIds: ['p-1', 'p-2'],
    ...over,
  };
}
