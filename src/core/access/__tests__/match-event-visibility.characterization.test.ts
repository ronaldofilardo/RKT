/**
 * CHARACTERIZATION TESTS — src/core/access/match-event-visibility.ts
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

import { canDiscoverMatchTemplate, type MatchTemplateAccess } from '../match-event-visibility';
import type { Actor } from '../types';

function actor(over: Partial<Actor> = {}): Actor {
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

function member(kind: 'PLATAFORMA' | 'GESTOR' | 'TREINADOR', extra: Partial<{ preset?: 'ADMIN' | 'SUPORTE' | null; ctId?: string | null; status: 'ACTIVE' | 'SUSPENDED' | 'ENDED' }> = {}) {
  return { kind, status: 'ACTIVE', ...extra } as any;
}

const CT = 'ct-1';
const OTHER_CT = 'ct-2';

function tpl(over: Partial<MatchTemplateAccess> = {}): MatchTemplateAccess {
  return {
    eventScope: 'PUBLIC',
    createdByUserId: 'creator',
    ctId: CT,
    participantPlayerIds: ['p-1', 'p-2'],
    ...over,
  };
}

describe('canDiscoverMatchTemplate (characterization)', () => {
  it('PUBLIC: qualquer usuário ativo autenticado descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-1' }), tpl({ eventScope: 'PUBLIC' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-2' }), tpl({ eventScope: 'PUBLIC' }))).toBe(true);
  });

  it('PUBLIC: usuário inativo não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-1', isActive: false }), tpl({ eventScope: 'PUBLIC' }))).toBe(false);
  });

  it('PUBLIC: ator nulo não descobre', () => {
    expect(canDiscoverMatchTemplate(null, tpl({ eventScope: 'PUBLIC' }))).toBe(false);
  });

  it('PRIVATE_CLUB: staff do CT dono descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('GESTOR', { ctId: CT })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('TREINADOR', { ctId: CT })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: staff de outro CT não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('TREINADOR', { ctId: OTHER_CT })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
  });

  it('PRIVATE_CLUB: atleta participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: responsável de menor participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ guardianOfPlayerIds: ['p-2'] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: treinador particular que acompanha participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ followedPlayerIds: ['p-2'] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(true);
  });

  it('PRIVATE_CLUB: atleta alheio ou treinador sem vínculo não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-9' }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
    expect(canDiscoverMatchTemplate(actor({ followedPlayerIds: ['p-9'] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
  });

  it('PRIVATE_CLUB: staff com vínculo suspenso não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ memberships: [member('GESTOR', { ctId: CT, status: 'SUSPENDED' })] }), tpl({ eventScope: 'PRIVATE_CLUB' }))).toBe(false);
  });

  it('PRIVATE_COACH: criador descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'creator' }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(true);
  });

  it('PRIVATE_COACH: atleta participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-9', athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(true);
  });

  it('PRIVATE_COACH: responsável de menor participante descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ guardianOfPlayerIds: ['p-1'] }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(true);
  });

  it('PRIVATE_COACH: usuário sem vínculo com participante não descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-9' }), tpl({ eventScope: 'PRIVATE_COACH' }))).toBe(false);
  });

  it('PRIVATE_PLAYERS: apenas atletas diretamente envolvidos (+ responsáveis de menores)', () => {
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ guardianOfPlayerIds: ['p-2'] }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-9' }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(false);
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-9' }), tpl({ eventScope: 'PRIVATE_PLAYERS' }))).toBe(false);
  });

  it('PRIVATE_PERSONAL: apenas o próprio criador descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'creator' }), tpl({ eventScope: 'PRIVATE_PERSONAL' }))).toBe(true);
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-2' }), tpl({ eventScope: 'PRIVATE_PERSONAL' }))).toBe(false);
    expect(canDiscoverMatchTemplate(actor({ athletePlayerId: 'p-1' }), tpl({ eventScope: 'PRIVATE_PERSONAL' }))).toBe(false);
  });

  it('PRIVATE_PERSONAL: sem criador, nenhum usuário descobre', () => {
    expect(canDiscoverMatchTemplate(actor({ userId: 'u-2' }), tpl({ eventScope: 'PRIVATE_PERSONAL', createdByUserId: null }))).toBe(false);
  });
});