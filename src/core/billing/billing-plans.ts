import type { PlanDefinition, BillingTarget } from '@/types/billing';

export const BILLING_PLANS: PlanDefinition[] = [
  {
    id: 'ATLETA_PRO',
    name: 'Atleta Pro',
    target: 'ATLETA_INDEPENDENTE',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    quotaAthletes: 1,
    quotaCoaches: 0,
    quotaMatches: null,
    tooltip: 'Partidas ilimitadas, análise avançada de golpes, histórico completo e notas de áudio.',
    features: [
      { title: 'Partidas ilimitadas', included: true },
      { title: 'Análise avançada de golpes', included: true },
      { title: 'Histórico completo e relatórios', included: true },
    ],
  },
  {
    id: 'COACH_START',
    name: 'Coach Start',
    target: 'TREINADOR_PARTICULAR',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    quotaAthletes: 5,
    quotaCoaches: 1,
    quotaMatches: null,
    extraAthletePrice: 7.9,
    tooltip: '1 treinador + até 5 atletas ativos. Gestão, anotação e relatórios básicos.',
    features: [
      { title: '1 treinador + até 5 atletas ativos', included: true },
      { title: 'Anotação ilimitada de jogos', included: true },
      { title: 'Atleta adicional por +R$ 7,90/mês', included: true },
    ],
  },
  {
    id: 'COACH_PRO',
    name: 'Coach Pro',
    target: 'TREINADOR_PARTICULAR',
    monthlyPrice: 79.99,
    yearlyPrice: 799.99,
    quotaAthletes: 10,
    quotaCoaches: 1,
    quotaMatches: null,
    extraAthletePrice: 7.9,
    tooltip: '1 treinador + até 10 atletas ativos. Relatórios em PDF, histórico e notas de áudio.',
    features: [
      { title: '1 treinador + até 10 atletas ativos', included: true },
      { title: 'Exportação de relatórios em PDF', included: true },
      { title: 'Atleta adicional por +R$ 7,90/mês', included: true },
    ],
  },
  {
    id: 'CT_PERFORMANCE',
    name: 'CT Performance',
    target: 'GESTOR_CT',
    monthlyPrice: 299.99,
    yearlyPrice: 2999.99,
    quotaAthletes: 25,
    quotaCoaches: 5,
    quotaMatches: null,
    extraAthletePrice: 5.9,
    extraCoachPrice: 49.9,
    tooltip: 'Até 5 treinadores + até 25 atletas ativos. Painel administrativo e relatórios do CT.',
    features: [
      { title: 'Até 5 treinadores + 25 atletas', included: true },
      { title: 'Painel administrativo do CT', included: true },
      { title: 'Treinador extra: +R$ 49,90 | Atleta extra: +R$ 5,90', included: true },
    ],
  },
  {
    id: 'CT_FULL',
    name: 'CT Full',
    target: 'GESTOR_CT',
    monthlyPrice: 499.99,
    yearlyPrice: 4999.99,
    quotaAthletes: 50,
    quotaCoaches: 10,
    quotaMatches: null,
    extraAthletePrice: 4.9,
    extraCoachPrice: 49.9,
    tooltip: 'Até 10 treinadores + até 50 atletas ativos. Comparativos entre turmas e suporte VIP.',
    features: [
      { title: 'Até 10 treinadores + 50 atletas', included: true },
      { title: 'Comparativos e suporte prioritário', included: true },
      { title: 'Treinador extra: +R$ 49,90 | Atleta extra: +R$ 4,90', included: true },
    ],
  },
];

export function getPlansForTarget(target: BillingTarget): PlanDefinition[] {
  return BILLING_PLANS.filter((p) => p.target === target);
}
