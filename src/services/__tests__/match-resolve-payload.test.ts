import type { Actor } from '@/core/access/types';
import {
  buildDerivedAnnotationData,
  resolveDerivedCtId,
  type TemplateRecord,
} from '../match-resolve-payload.logic';
import { resolveAnnotationCtId, resolveMatchCtId } from '../match-ct-id.logic';

function makeActor(over: Partial<Actor> = {}): Actor {
  return {
    userId: 'coach-1',
    isActive: true,
    canOperate: true,
    memberships: [],
    athletePlayerId: null,
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
    ...over,
  };
}

const cartazDoCt = {
  id: 'tpl-ct-1',
  state: 'SCHEDULED',
  sourceMatchId: null,
  isTemplate: true,
  isPublicTemplate: false,
  createdByUserId: 'gestor-1',
  assignedCoachId: 'coach-1',
  ctId: 'ct-1',
  player1Id: 'p1',
  player2Id: 'p2',
  player1PartnerId: null,
  player2PartnerId: null,
  matchType: 'SINGLES',
  format: 'BEST_OF_3',
  sportType: 'TENNIS',
  courtType: 'CLAY',
  nickname: null,
  scheduledAt: null,
  tournamentName: null,
  clubName: null,
  category: null,
  round: null,
  bracketType: null,
  temperature: null,
  humidity: null,
  details: null,
  eventScope: 'PRIVATE_CLUB',
  isOfficialClubAnnotation: false,
} as unknown as TemplateRecord;

const membro = makeActor({
  memberships: [{ kind: 'TREINADOR', ctId: 'ct-1', status: 'ACTIVE' }],
});

describe('resolveDerivedCtId (Fase C: ctId estrito entre CT e PARTICULAR)', () => {
  it('PARTICULAR ativo (explicitCtId null) NÃO herda o CT do cartaz', () => {
    expect(resolveDerivedCtId(cartazDoCt, membro, null)).toBeNull();
  });

  it('token sem contexto (undefined) infere template.ctId para membro ativo', () => {
    expect(resolveDerivedCtId(cartazDoCt, membro, undefined)).toBe('ct-1');
  });

  it('token sem contexto não infere CT para quem não é membro', () => {
    const estranho = makeActor({ userId: 'outsider' });
    expect(resolveDerivedCtId(cartazDoCt, estranho, undefined)).toBeNull();
  });

  it('contexto de CT explícito é usado como está', () => {
    expect(resolveDerivedCtId(cartazDoCt, membro, 'ct-2')).toBe('ct-2');
  });

  it('atleta (athleteCtIds) infere o CT do cartaz apenas sem ctId explícito', () => {
    const atleta = makeActor({ userId: 'athlete-1', athleteCtIds: ['ct-1'] });
    expect(resolveDerivedCtId(cartazDoCt, atleta, undefined)).toBe('ct-1');
    expect(resolveDerivedCtId(cartazDoCt, atleta, null)).toBeNull();
  });
});

describe('buildDerivedAnnotationData grava o ctId resolvido', () => {
  it('gravos null explícito no modo PARTICULAR (coluna sem herança silenciosa)', () => {
    const { data, resolvedCtId } = buildDerivedAnnotationData(cartazDoCt, membro, null);
    expect(resolvedCtId).toBeNull();
    expect(data).toHaveProperty('ctId', null);
    expect(data.sourceMatchId).toBe('tpl-ct-1');
  });

  it('grava o CT do cartaz quando não há contexto explícito e o ator é membro', () => {
    const { data, resolvedCtId } = buildDerivedAnnotationData(cartazDoCt, membro, undefined);
    expect(resolvedCtId).toBe('ct-1');
    expect(data).toHaveProperty('ctId', 'ct-1');
  });
});

describe('resolveMatchCtId (helper único de criação)', () => {
  it('PARTICULAR ativo retorna null mesmo com fallback', () => {
    expect(resolveMatchCtId({ contextId: 'PARTICULAR' }, 'ct-9')).toBeNull();
  });

  it('contexto de CT vence o ctId vindo do cliente', () => {
    expect(resolveMatchCtId({ contextId: 'ct-1' }, 'ct-9')).toBe('ct-1');
  });

  it('token sem contexto usa o fallback do cliente', () => {
    expect(resolveMatchCtId({ contextId: null }, 'ct-7')).toBe('ct-7');
  });

  it('token sem contexto e sem fallback resulta em null', () => {
    expect(resolveMatchCtId(undefined)).toBeNull();
    expect(resolveMatchCtId(null)).toBeNull();
  });
});

describe('resolveAnnotationCtId (rotas /annotate)', () => {
  it('PARTICULAR força null (corrige herança indevida do CT do cartaz)', () => {
    expect(resolveAnnotationCtId({ contextId: 'PARTICULAR' })).toBeNull();
  });

  it('token sem contexto devolve undefined para inferir do cartaz', () => {
    expect(resolveAnnotationCtId({ contextId: undefined })).toBeUndefined();
    expect(resolveAnnotationCtId(null)).toBeUndefined();
  });

  it('contexto de CT devolve o próprio ctId', () => {
    expect(resolveAnnotationCtId({ contextId: 'ct-1' })).toBe('ct-1');
  });
});
