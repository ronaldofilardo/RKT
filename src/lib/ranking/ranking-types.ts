/**
 * Tipos e constantes canônicos de modalidades de ranking.
 *
 * Módulo base (sem dependências internas) — é importado pelos módulos
 * de categoria/eligibilidade sem risco de ciclo.
 */

export const RANKING_TYPES = ['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ITF_Juniors', 'ATP', 'WTA'] as const;

export type RankingType = (typeof RANKING_TYPES)[number];

export const RANKING_TYPE_LABELS: Record<RankingType, string> = {
  ESTADUAL: 'Estadual',
  CBT: 'CBT',
  COSAT: 'COSAT',
  ITF: 'ITF',
  ITF_Juniors: 'ITF Juniors',
  ATP: 'ATP',
  WTA: 'WTA',
};
