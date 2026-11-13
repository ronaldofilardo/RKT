/**
 * CONTRATO PÓS-FASE 2 — src/core/access/visibility.ts
 *
 * Valida o comportamento estrito de isolamento por anotador após a Fase 2 do
 * PLANO_ISOLAMENTO_ANOTACOES_POR_ANOTADOR:
 * - canReadMatch: apenas criador dono e gestor ativo do CT dono (ou atleta com
 *   allowParticipantOfficialRead=true em anotação oficial). Nunca cartazes.
 * - canAnnotateMatch: apenas criador dono no contexto compatível. Nunca cartazes.
 * - canReadMatchComments: apenas criador dono e gestor ativo do CT dono.
 * - canWatchMatch: concessão explícita de espectador ou canReadMatch.
 */

import {
  canReadMatch,
  canAnnotateMatch,
  canReadMatchComments,
  canWatchMatch,
  type MatchAccess,
} from '../visibility';
import type { Actor } from '../types';

const CT = 'ct-1';
const OTHER_CT = 'ct-2';

function actor(over: Partial<Actor> = {}): Actor {
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

function member(
  kind: 'PLATAFORMA' | 'GESTOR' | 'TREINADOR',
  extra: Partial<{ preset?: 'ADMIN' | 'SUPORTE' | null; ctId?: string | null; status: 'ACTIVE' | 'SUSPENDED' | 'ENDED' }> = {},
) {
  return { kind, status: 'ACTIVE', ...extra } as any;
}

const match: MatchAccess = {
  createdByUserId: 'creator',
  ctId: CT,
  isTemplate: false,
  isOfficialClubAnnotation: false,
  annotatorUserIds: ['annotator'],
  participantPlayerIds: ['p-1', 'p-2'],
  participantCtIds: [OTHER_CT],
};

describe('visibility.ts (contrato pós-Fase 2)', () => {
  it('canReadMatch libera criador e gestor do CT dono, e bloqueia vazamentos cruzados', () => {
    expect(canReadMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);

    expect(canReadMatch(actor({ userId: 'annotator' }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('TREINADOR', { ctId: OTHER_CT })] }), match)).toBe(false);
    expect(canReadMatch(actor({ athletePlayerId: 'p-2' }), match)).toBe(false);
    expect(canReadMatch(actor({ guardianOfPlayerIds: ['p-1'] }), match)).toBe(false);
    expect(canReadMatch(actor({ followedPlayerIds: ['p-1'] }), match)).toBe(false);
    expect(canReadMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })], activeContextId: CT }), match)).toBe(false);
  });

  it('canAnnotateMatch libera exclusivamente o criador dono no contexto válido', () => {
    expect(canAnnotateMatch(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canAnnotateMatch(actor({ userId: 'creator', activeContextId: 'PARTICULAR' }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ athletePlayerId: 'p-1' }), match)).toBe(false);
    expect(canAnnotateMatch(actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }), match)).toBe(false);
  });

  it('canReadMatchComments e canWatchMatch respeitam isolamento estrito', () => {
    expect(canReadMatchComments(actor({ userId: 'creator' }), match)).toBe(true);
    expect(canReadMatchComments(actor({ memberships: [member('GESTOR', { ctId: CT })] }), match)).toBe(true);
    expect(canReadMatchComments(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), match)).toBe(false);
    expect(canWatchMatch(actor({ userId: 'outsider' }), match, false)).toBe(false);
    expect(canWatchMatch(actor({ userId: 'outsider' }), match, true)).toBe(true);
  });
});
