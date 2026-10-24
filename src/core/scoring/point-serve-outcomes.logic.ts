import type { PointDetails } from './types';

export interface ServeOutcomes {
  rallyLength: number;
  firstFault?: PointDetails['firstFaultDetail'];
  firstServeOutcome: 'ace' | 'out' | 'net' | null;
  secondServeOutcome: 'ace' | 'out' | 'net' | null;
}

/**
 * Deriva o resultado dos saques e o comprimento do rally a partir do ponto
 * registrado. Função pura extraída de `enrichPointsFromHistory`.
 */
export function deriveServeOutcomes(pt: PointDetails): ServeOutcomes {
  const isServeFinish = pt.type === 'ACE' || pt.type === 'DOUBLE_FAULT';
  const isDevolucao = pt.rallyDetails?.situacao === 'devolucao';
  const rallyLength = pt.rallyLength ?? (isServeFinish ? 1 : isDevolucao ? 2 : 0);

  // firstFault representa o erro do 1o saque independente de como o ponto
  // terminou — a única condição é ter sido registrado.
  const firstFault = pt.firstFaultDetail ?? undefined;

  const firstServeOutcome: 'ace' | 'out' | 'net' | null =
    pt.type === 'ACE' && pt.isFirstServe
      ? 'ace'
      : pt.firstFaultDetail?.errorType === 'out'
        ? 'out'
        : pt.firstFaultDetail?.errorType === 'net'
          ? 'net'
          : null;

  const secondServeOutcome: 'ace' | 'out' | 'net' | null =
    pt.type === 'ACE' && pt.isSecondServe
      ? 'ace'
      : pt.type === 'DOUBLE_FAULT'
        ? (pt.rallyDetails?.subtipo2 as 'out' | 'net' | undefined) ?? null
        : null;

  return { rallyLength, firstFault, firstServeOutcome, secondServeOutcome };
}
