/**
 * CONTRATO PÓS-FASE 2 — src/core/access/visibility.ts
 *
 * Kit de testes de visibility.characterization.test.ts (não é .test.ts: fica
 * fora da coleta do Jest e não é limitado a 80L). Concentra o arrange:
 * actor()/member() (atores padrão) e match (MatchAccess base, constante em
 * todos os testes), além de CT/OTHER_CT.
 *
 * Valida o comportamento estrito de isolamento por anotador após a Fase 2 do
 * PLANO_ISOLAMENTO_ANOTACOES_POR_ANOTADOR:
 * - canReadMatch: apenas criador dono e gestor ativo do CT dono (ou atleta com
 *   allowParticipantOfficialRead=true em anotação oficial). Nunca cartazes.
 * - canAnnotateMatch: apenas criador dono no contexto compatível. Nunca cartazes.
 * - canReadMatchComments: apenas criador dono e gestor ativo do CT dono.
 * - canWatchMatch: concessão explícita de espectador ou canReadMatch.
 */

import type { MatchAccess } from '../visibility';
import type { Actor } from '../types';

export const CT = 'ct-1';
export const OTHER_CT = 'ct-2';

export function actor(over: Partial<Actor> = {}): Actor {
  return {
    userId: 'u-1',
    isActive: true,
    canOperate: false,
    memberships: [],
    athletePlayerId: null,
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
    activeContextId: undefined,
    activeArea: undefined,
    ...over,
  };
}

export function member(
  kind: 'PLATAFORMA' | 'GESTOR' | 'TREINADOR',
  extra: Partial<{ preset?: 'ADMIN' | 'SUPORTE' | null; ctId?: string | null; status: 'ACTIVE' | 'SUSPENDED' | 'ENDED' }> = {},
) {
  return { kind, status: 'ACTIVE', ...extra } as any;
}

export const match: MatchAccess = {
  createdByUserId: 'creator',
  ctId: CT,
  isTemplate: false,
  isOfficialClubAnnotation: false,
  annotatorUserIds: ['annotator'],
  participantPlayerIds: ['p-1', 'p-2'],
  participantCtIds: [OTHER_CT],
};
