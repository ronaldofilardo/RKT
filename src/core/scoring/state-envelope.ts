import type { ScoringState } from './types';

/**
 * Desembrulha um estado de scoring que pode vir cru ou dentro do envelope
 * legado `{ state, history }`.
 *
 * As fronteiras de desserialização (engine, histórico de pontos, edições de
 * placar) recebem dados em qualquer um dos dois formatos porque versões
 * anteriores gravavam o envelope completo. Este helper centraliza o ternário
 * histórico e elimina os casts `as any` repetidos (R-06).
 *
 * Preserva exatamente o comportamento original: só desembrulha quando o valor
 * é um objeto não-nulo com chave `state` truthy; caso contrário devolve o
 * valor cru (incluindo falsy).
 */
export function unwrapStateEnvelope(raw: unknown): ScoringState {
  if (raw && typeof raw === 'object' && 'state' in raw) {
    const inner = (raw as { state?: unknown }).state;
    if (inner) return inner as ScoringState;
  }
  return raw as ScoringState;
}
