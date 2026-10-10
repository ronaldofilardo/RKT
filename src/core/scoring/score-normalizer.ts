// TODO: Remove this file after data migration window closes. It normalizes corrupted data from a historical bug (Bug #4, 2026-08-07).
import type { TennisFormat } from './types';
import { isMatchTiebreakSetIndex as isMatchTiebreakSetIndexCanonical } from '@/lib/matchConfig';

/**
 * Sanea um scoreState legado/corrompido para o formato canonical.
 *
 * Bug #4 (2026-08-07): em produção, sets de Match Tiebreak eram persistidos
 * com pontos gravados em player1/player2 e SEM tiebreakScore (devido ao
 * antigo handleConfirm que descartava tiebreakScore). Esta função detecta
 * esse padrão e converte de volta para o formato canonical
 * ({ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { ... } }).
 *
 * Suporta os formatos: MATCH_TB_10, BEST_OF_3_MATCH_TB, BEST_OF_5 (5th set),
 * BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD.
 *
 * Esta é a versão unificada — substitui a implementação fragmentada em
 * src/components/dashboard/match-card-utils.ts (que não cobria BEST_OF_5).
 */
export interface NormalizedScoreState {
  sets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
  currentGame?: {
    player1: number | string;
    player2: number | string;
    isDeuce?: boolean;
    advantage?: 'player1' | 'player2' | null;
  };
  setsWon?: { player1: number; player2: number };
  server?: 'player1' | 'player2';
}

/**
 * Determina se um índice de set em um formato dado deve ser tratado como
 * Match Tiebreak decisivo (5º set no BO5, 3º set em BO3 MT, etc.).
 * Delega à função canônica em lib/matchConfig.ts.
 */
export function isMatchTiebreakSetIndex(
  setIndex: number,
  _totalSets: number,
  format: TennisFormat,
  completedSetsBefore: { p1Won: number; p2Won: number } = { p1Won: 0, p2Won: 0 },
): boolean {
  return isMatchTiebreakSetIndexCanonical(
    setIndex,
    { player1: completedSetsBefore.p1Won, player2: completedSetsBefore.p2Won },
    format,
  );
}

function parseRawScoreState(rawScoreState: unknown): Record<string, unknown> | null {
  if (!rawScoreState) return null;
  let parsed = rawScoreState as Record<string, unknown>;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed as string);
    } catch {
      return null;
    }
  }
  // Snapshot serializado contém { state, history } — extrair só o state.
  if (parsed?.state && Array.isArray(parsed?.history)) {
    parsed = parsed.state as Record<string, unknown>;
  }
  return parsed;
}

/**
 * Extrai o array history do rawScoreState (antes de extrair só o state).
 * Usado para reconstruir tiebreakScore de sets corrompidos.
 */
export function extractHistory(rawScoreState: unknown): Record<string, unknown>[] | null {
  if (!rawScoreState) return null;
  let parsed = rawScoreState as Record<string, unknown>;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed as string);
    } catch {
      return null;
    }
  }
  if (parsed?.state && Array.isArray(parsed?.history)) {
    return parsed.history;
  }
  return null;
}

/**
 * Tenta reconstruir o tiebreakScore de um set a partir do history.
 *
 * Procura de trás pra frente o último stateBefore onde o set no índice
 * `setIndex` tinha isTiebreak: true e tiebreakScore preenchido.
 */
function reconstructTiebreakFromHistory(
  history: Record<string, unknown>[] | null,
  setIndex: number,
): { player1: number; player2: number } | null {
  if (!history || !Array.isArray(history)) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    const stateBefore = entry?.stateBefore as Record<string, unknown> | undefined;
    const sets = stateBefore?.sets as Record<string, unknown>[] | undefined;
    if (!Array.isArray(sets)) continue;
    const set = sets[setIndex];
    if (set && set.isTiebreak && set.tiebreakScore) {
      const tb = set.tiebreakScore as { player1: number; player2: number };
      return { player1: tb.player1, player2: tb.player2 };
    }
  }
  return null;
}

function looksLikeMatchTiebreakFormat(format: TennisFormat): boolean {
  return (
    format === 'MATCH_TB_10' ||
    format === 'BEST_OF_3_MATCH_TB' ||
    format === 'BEST_OF_5' ||
    format === 'BEST_OF_3_NO_AD' ||
    format === 'SHORT_SET_2V2_NO_AD'
  );
}

function sanitizeMatchTiebreakSet(set: Record<string, unknown>): Record<string, unknown> {
  return {
    ...set,
    tiebreakScore: { player1: set.player1, player2: set.player2 },
    player1: 0,
    player2: 0,
    isTiebreak: true,
  };
}

function updateSetsWon(
  set: Record<string, unknown>,
  counts: { p1Won: number; p2Won: number },
): void {
  if (!set) return;
  const isSetFinished =
    !set.isTiebreak || (set.isTiebreak && set.tiebreakScore);
  if (isSetFinished) {
    if ((set.player1 as number) > (set.player2 as number)) counts.p1Won++;
    else if ((set.player2 as number) > (set.player1 as number)) counts.p2Won++;
  }
}

function normalizeMatchTiebreakSets(sets: Record<string, unknown>[], format: TennisFormat): Record<string, unknown>[] {
  const counts = { p1Won: 0, p2Won: 0 };
  return sets.map((set: Record<string, unknown>, idx: number) => {
    const isMtSet = isMatchTiebreakSetIndex(
      idx,
      sets.length,
      format,
      counts,
    );

    const isCorruptedMt =
      isMtSet &&
      set &&
      ((set.player1 as number) > 0 || (set.player2 as number) > 0) &&
      !set.isTiebreak &&
      !set.tiebreakScore;

    if (isCorruptedMt) {
      return sanitizeMatchTiebreakSet(set);
    }

    updateSetsWon(set, counts);
    return set;
  });
}

function normalizeRegularTiebreakSets(sets: Record<string, unknown>[], rawScoreState: unknown): Record<string, unknown>[] {
  const history = extractHistory(rawScoreState);
  return sets.map((set: Record<string, unknown>, idx: number) => {
    if (!set || set.tiebreakScore != null) return set;
    const is76 = set.player1 === 7 && set.player2 === 6;
    const is67 = set.player1 === 6 && set.player2 === 7;
    if (!is76 && !is67) return set;
    const reconstructed = reconstructTiebreakFromHistory(history, idx);
    return reconstructed ? { ...set, tiebreakScore: reconstructed } : set;
  });
}

/**
 * Legado — Sets Curtos 2/2: versões antigas do motor empilhavam o placar
 * inicial 2-2 como se fosse um set (ex.: [2-2, 4-2, 4-2]). Um set 2-2 sem
 * tiebreak que NÃO é o último item do array nunca é um set real (um set
 * concluído não termina em 2-2), então é descartado para que a posição de
 * cada set volte a bater com o número do set.
 */
function stripLegacyInitialPlaceholder(
  sets: Record<string, unknown>[],
  format?: TennisFormat,
): Record<string, unknown>[] {
  if (format !== 'SHORT_SET_2V2_NO_AD' || sets.length < 2) return sets;
  const first = sets[0];
  const isPlaceholder =
    first &&
    first.player1 === 2 &&
    first.player2 === 2 &&
    !first.isTiebreak &&
    first.tiebreakScore == null;
  return isPlaceholder ? sets.slice(1) : sets;
}

function ensureDefaultCurrentGame(parsed: Record<string, unknown>): NormalizedScoreState {
  return {
    ...parsed,
    currentGame: parsed.currentGame ?? {
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
    },
  } as NormalizedScoreState;
}

/**
 * Sanea um scoreState para o formato canonical.
 *
 * Heurística de detecção do bug: um set com (player1 > 0 || player2 > 0),
 * sem isTiebreak e sem tiebreakScore, em formato/posição que deveria ser MT.
 * Converte: pontos vão para tiebreakScore, games voltam a 0, isTiebreak: true.
 */
export function normalizeScoreState(
  rawScoreState: unknown,
  format?: TennisFormat,
): NormalizedScoreState | null {
  const parsed = parseRawScoreState(rawScoreState);
  if (!parsed || !parsed.sets || !Array.isArray(parsed.sets)) return null;

  let currentSets = stripLegacyInitialPlaceholder(parsed.sets, format);

  if (format && looksLikeMatchTiebreakFormat(format)) {
    currentSets = normalizeMatchTiebreakSets(currentSets, format);
  }

  currentSets = normalizeRegularTiebreakSets(currentSets, rawScoreState);
  parsed.sets = currentSets;

  return ensureDefaultCurrentGame(parsed);
}
