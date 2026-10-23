import type { TennisFormat } from '@/core/scoring/types';
import type { CompletedSet } from '@/core/scoring/edit-score-state';
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { validateSetResult } from '@/core/scoring/edit-score-domain';
import type { EditableState } from './edit-score-confirm.types';

// Bug (2026-09-07) — ALTO: determina se um set completado (possivelmente
// editado manualmente pelo usuário via openEditCompletedSet) tem de fato
// um vencedor definido, ou se é um placar incompleto/inválido (ex.: 5-4)
// que o usuário digitou por engano. `validateSetResult` sozinho não basta
// para sets 6-6: ele sempre retorna "Tiebreak required" (sem vencedor) para
// 6x6, mesmo quando o set JÁ tem um `tiebreakScore` anexado que resolve o
// empate — esse é o formato normal de armazenamento de um set decidido no
// tiebreak neste código (games ficam 6x6, o vencedor vem do tiebreakScore).
function isCompletedSetGenuinelyPartial(
  p1Games: number,
  p2Games: number,
  tiebreakScore: { player1: number; player2: number } | null | undefined,
  matchFormat: TennisFormat,
): boolean {
  const result = validateSetResult({ p1Games, p2Games }, matchFormat);
  if (result.winner) return false;
  if (result.tiebreakRequired && tiebreakScore && tiebreakScore.player1 !== tiebreakScore.player2) {
    return false;
  }
  return true;
}

export function getCompletedSets(state: EditableState, completedSets: CompletedSet[], matchFormat: TennisFormat): SetEditData[] {
  // Always use editableCompletedSets when defined (initialized from props on
  // open). Falling back to `completedSets` when the array is empty discards
  // user removals — Bug #11.
  const source = state.editableCompletedSets ?? completedSets;
  return source.map((set) => {
    const p1Games = 'games' in set ? set.games.player1 : set.p1Games;
    const p2Games = 'games' in set ? set.games.player2 : set.p2Games;
    const tiebreakScore = set.tiebreakScore ?? null;
    // Bug (2026-09-07) — ALTO: antes, `isPartial` era sempre `false` aqui,
    // independente do placar real. Isso permitia que um set completado
    // editado pelo usuário para um placar incompleto (ex.: 5-4, que
    // openEditCompletedSet aceita sem erro por não ser tecnicamente
    // inválido) fosse enviado a onConfirm/ao backend marcado como um set
    // COMPLETO e vencido por alguém, contaminando o placar da partida.
    return {
      p1Games,
      p2Games,
      isPartial: isCompletedSetGenuinelyPartial(p1Games, p2Games, tiebreakScore, matchFormat),
      ...(tiebreakScore ? { tiebreakScore } : {}),
    };
  });
}

// Bug (2026-09-07): calculateNextServer precisa da mesma fonte de sets
// concluídos que getCompletedSets() usa para o payload de onConfirm —
// caso contrário, editar o placar de um set já finalizado (via
// openEditCompletedSet) salva o placar certo mas calcula o sacador com
// base no set NÃO editado (prop `completedSets` crua), produzindo um
// sacador incorreto sempre que a edição muda a paridade de games da
// partida. Esta função converte a saída de getCompletedSets (SetEditData[],
// já refletindo editableCompletedSets) para o shape CompletedSet[] que
// calculateNextServer espera.
export function toCompletedSetsForServer(
  state: EditableState,
  completedSets: CompletedSet[],
  matchFormat: TennisFormat,
): CompletedSet[] {
  return getCompletedSets(state, completedSets, matchFormat).map((set) => {
    // Determinar vencedor consultando tiebreakScore quando games estão
    // empatados (6-6 em set regular, ou 1-0/0-1 em MTB puro). Sem isso,
    // p1Games > p2Games resolvia incorretamente para 'player2' em sets
    // decididos por tiebreak com games empatados.
    let winner: 'player1' | 'player2';
    if (set.p1Games > set.p2Games) {
      winner = 'player1';
    } else if (set.p2Games > set.p1Games) {
      winner = 'player2';
    } else if (set.tiebreakScore) {
      winner = set.tiebreakScore.player1 > set.tiebreakScore.player2 ? 'player1' : 'player2';
    } else {
      winner = 'player2';
    }
    return {
      games: { player1: set.p1Games, player2: set.p2Games },
      winner,
      ...(set.tiebreakScore ? { tiebreakScore: set.tiebreakScore } : {}),
    };
  });
}
