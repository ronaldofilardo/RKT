import type { BillingAccountState, BillingTarget } from '@/types/billing';

export interface QuotaEvaluationInput {
  role?: string;
  activeContextId?: string | null;
  activeArea?: string | null;
  isLinkedToPayingEntity?: boolean;
  hasActivePaidPlan?: boolean;
  matchesCount: number;
  accountCreatedAt: Date | string;
  now?: Date;
}

export function resolveBillingTarget(input: QuotaEvaluationInput): BillingTarget | null {
  if (input.activeArea === 'GESTOR' || input.activeContextId?.startsWith('ct_')) return 'GESTOR_CT';
  if (input.activeArea === 'TREINADOR' || input.activeContextId === 'PARTICULAR') {
    return 'TREINADOR_PARTICULAR';
  }
  if (input.activeArea === 'ATLETA' || !input.activeContextId) return 'ATLETA_INDEPENDENTE';
  return null;
}

export function calculateBillingState(input: QuotaEvaluationInput): BillingAccountState {
  if (input.hasActivePaidPlan || input.isLinkedToPayingEntity || input.role === 'ADMIN') {
    return {
      status: 'ACTIVE', target: null, planId: null, matchesUsed: input.matchesCount,
      matchesLimit: null, daysRemaining: null, daysLimit: null, canCreateMatch: true,
      canAddAthletes: true, message: 'Plano ativo ou vinculado com acesso ilimitado.',
    };
  }

  const target = resolveBillingTarget(input);
  if (target === 'GESTOR_CT') {
    const created = new Date(input.accountCreatedAt).getTime();
    const current = (input.now || new Date()).getTime();
    const daysUsed = Math.floor((current - created) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 30 - daysUsed);

    if (daysRemaining <= 0) {
      return {
        status: 'EXPIRED', target, planId: null, matchesUsed: input.matchesCount,
        matchesLimit: null, daysRemaining: 0, daysLimit: 30, canCreateMatch: false,
        canAddAthletes: false, message: 'Período de degustação de 30 dias encerrado.',
      };
    }
    return {
      status: daysRemaining === 1 ? 'LAST_FREE' : 'FREE_TRIAL',
      target, planId: null, matchesUsed: input.matchesCount, matchesLimit: null,
      daysRemaining, daysLimit: 30, canCreateMatch: true, canAddAthletes: true,
      message: daysRemaining === 1 ? 'Último dia de degustação gratuita.' : `Restam ${daysRemaining} dias de teste.`,
    };
  }

  const limit = 3;
  const used = input.matchesCount;
  if (used >= limit) {
    return {
      status: 'EXPIRED', target, planId: null, matchesUsed: used, matchesLimit: limit,
      daysRemaining: null, daysLimit: null, canCreateMatch: false, canAddAthletes: false,
      message: 'Degustação de 3 partidas encerrada. Modo consulta ativo.',
    };
  }
  return {
    status: used === 2 ? 'LAST_FREE' : 'FREE_TRIAL',
    target, planId: null, matchesUsed: used, matchesLimit: limit,
    daysRemaining: null, daysLimit: null, canCreateMatch: true, canAddAthletes: true,
    message: used === 2 ? 'Atenção: esta é a sua última partida livre.' : `Partidas gratuitas: ${used} de ${limit} usadas.`,
  };
}
