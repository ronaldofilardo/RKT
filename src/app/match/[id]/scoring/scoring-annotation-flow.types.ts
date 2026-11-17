import type { HowPointEnded, WhereWinner } from '@/components/scoring/usePointAnnotationFlow';
import type { RallySituacao, RallyTipo } from '@/core/scoring/rally.types';

export const HOW_TO_TIPO: Partial<Record<HowPointEnded, RallyTipo>> = {
  WINNER: 'winner',
  ERRO_FORCADO: 'erro_forcado',
  ERRO_NAO_FORCADO: 'erro_nao_forcado',
};

export const WHERE_TO_SITUACAO: Record<WhereWinner, RallySituacao> = {
  devolvendo: 'devolucao',
  sacando: 'saque',
  fundo: 'fundo',
  voleio: 'rede',
  passando: 'passada',
};

export function resolveRallyTipo(howEnded: HowPointEnded | null): RallyTipo | undefined {
  return howEnded ? HOW_TO_TIPO[howEnded] : undefined;
}

export function resolveRallySituacao(whereWinner: WhereWinner | null): RallySituacao | undefined {
  return whereWinner ? WHERE_TO_SITUACAO[whereWinner] : undefined;
}
