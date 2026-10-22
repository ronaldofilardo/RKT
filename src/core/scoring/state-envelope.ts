import type { HistoryEntry, ScoringState } from './types';

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

/**
 * Desembrulha a resposta do servidor preservando o contrato de
 * `applySuccessResult`: o envelope só é assumido quando existe `state`
 * truthy E `history` é um array; caso contrário o valor cru é tratado
 * como estado plano e o `fallbackHistory` (história local) é mantido.
 */
export function unwrapEnvelopeWithHistory(
  raw: unknown,
  fallbackHistory: HistoryEntry[],
): { state: ScoringState; historyToRestore: HistoryEntry[] } {
  const envelopeCandidate = raw as {
    state?: ScoringState;
    history?: HistoryEntry[];
  } | null;
  const isEnvelope = Boolean(envelopeCandidate?.state) && Array.isArray(envelopeCandidate?.history);

  return {
    state:
      isEnvelope && envelopeCandidate?.state
        ? envelopeCandidate.state
        : (raw as ScoringState),
    historyToRestore:
      isEnvelope && envelopeCandidate?.history ? envelopeCandidate.history : fallbackHistory,
  };
}

/**
 * Proteção do fluxo de ponto: quando o servidor devolve um placar sem
 * tiebreak mas o estado local está em tiebreak, o local é mantido para
 * não perder o progresso do super-tiebreak.
 */
export function shouldKeepLocalStateForMissingTiebreak(
  localState: ScoringState,
  serverState: ScoringState,
): boolean {
  const localInTiebreak = localState.sets?.some(
    (s) => Boolean(s.isTiebreak) && Boolean(s.tiebreakScore),
  );
  const serverHasTiebreak = serverState.sets?.some(
    (s) => Boolean(s.isTiebreak) && Boolean(s.tiebreakScore),
  );

  return Boolean(localInTiebreak && !serverHasTiebreak);
}
