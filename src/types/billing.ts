export type BillingStatus = 'FREE_TRIAL' | 'LAST_FREE' | 'EXPIRED' | 'ACTIVE' | 'EXEMPT';

export type BillingTarget = 'ATLETA_INDEPENDENTE' | 'TREINADOR_PARTICULAR' | 'GESTOR_CT';

export type PlanTier =
  | 'ATLETA_PRO'
  | 'COACH_START'
  | 'COACH_PRO'
  | 'CT_PERFORMANCE'
  | 'CT_FULL'
  | 'CT_ENTERPRISE';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface PlanFeature {
  title: string;
  included: boolean;
}

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  target: BillingTarget;
  monthlyPrice: number;
  yearlyPrice: number;
  quotaAthletes: number | null;
  quotaCoaches: number | null;
  quotaMatches: number | null;
  tooltip: string;
  features: PlanFeature[];
  extraAthletePrice?: number;
  extraCoachPrice?: number;
}

export interface BillingAccountState {
  status: BillingStatus;
  target: BillingTarget | null;
  planId: PlanTier | null;
  matchesUsed: number;
  matchesLimit: number | null;
  daysRemaining: number | null;
  daysLimit: number | null;
  canCreateMatch: boolean;
  canAddAthletes: boolean;
  message: string;
}
