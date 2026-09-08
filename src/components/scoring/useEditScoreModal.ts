"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "./editScoreHelpers";
import { validateSetResult, getMaxValidGames } from "./editScoreHelpers";
import type { CompletedSet } from "./edit-score-logic";
import {
  createInitialEditScoreState,
  createSetEditData,
  calculateNextServer,
  getEffectiveSetWinner,
} from "./edit-score-logic";
import { parsePointValue, pointToProgress } from "@/core/scoring/point-utils";
import { SCORING_LIMITS } from "@/lib/constants";
import { useEditScoreCalculator } from "./use-edit-score-calculator";
import { getFloorError, getFreshFloorError, getCompletedSets, toCompletedSetsForServer } from "./useEditScoreModal.confirm.helpers";

interface EditScoreModalState {
  p1Input: string;
  p2Input: string;
  tiebreakP1: string;
  tiebreakP2: string;
  p1Points: string;
  p2Points: string;
  nextServer: "player1" | "player2";
  newSets: SetEditData[];
  editableCompletedSets: Array<{
    p1Games: number;
    p2Games: number;
    isPartial: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
}

interface UseEditScoreModalOptions {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: "player1" | "player2";
  completedSets: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  // Quando true, currentGamePoints traz os pontos de um tie-break de set já
  // em andamento (valores brutos, ex.: 3 e 4), não pontos de game.
  isTiebreak?: boolean;
  floorCurrentSets?: { player1: number; player2: number } | null;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
}

interface UseEditScoreModalReturn {
  state: EditScoreModalState;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  confirmError: string | null;
  floorValidationError: string | null;
  isConfirming: boolean;
  calculations: any;
  handleGameInputChange: (value: string, setter: (v: string) => void, player: 'p1' | 'p2', otherInput?: string) => void;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  handleAddSet: () => void;
  handleConfirmSet: () => void;
  canConfirmSet: boolean;
  handlePointsChange: (p1: string, p2: string) => void;
  handleEditCompletedSet: (index: number, p1Games: number, p2Games: number) => void;
  resetState: () => void;
}

export function useEditScoreModal(
  options: UseEditScoreModalOptions,
  onConfirm: (setResults: SetEditData[], server: "player1" | "player2") => void,
  onCancel: () => void,
  onMatchFinished?: (winner: "player1" | "player2") => void
): UseEditScoreModalReturn {
  const {
    isOpen,
    matchFormat,
    currentSets,
    currentServer,
    completedSets,
    currentGamePoints,
    isTiebreak,
    floorCurrentSets,
    onRefreshFloor,
  } = options;

  const [state, setState] = useState<EditScoreModalState>(() => {
    const initialState = createInitialEditScoreState(currentServer);
    return {
      ...initialState,
      editableCompletedSets: completedSets.map((cs) => ({
        p1Games: cs.games.player1,
        p2Games: cs.games.player2,
        isPartial: false,
        tiebreakScore: cs.tiebreakScore,
      })),
    };
  });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const initializedRef = useRef(false);
  const initialGameRef = useRef<{ player1: string; player2: string } | null>(null);
  const inputTouchedRef = useRef({ p1: false, p2: false });
  // Track the previous open state to detect transitions (false -> true),
  // so we only fully reset state when the modal (re)opens — not on every
  // re-render of the parent that passes a new (identity-different) completedSets prop.
  const prevIsOpenRef = useRef(false);
  // Track the serialized content of completedSets so we don't reset state
  // when only the array identity changes (but content stays the same).
  const lastCompletedSetsKeyRef = useRef<string>("");
  // Bug (2026-09-07): indices of completed sets the user has manually edited
  // via handleEditCompletedSet. Used below to avoid silently discarding an
  // in-progress edit when the parent pushes a `completedSets` update (e.g.
  // a live socket update from another device annotating the same match)
  // while the modal is open.
  const editedCompletedSetIndicesRef = useRef<Set<number>>(new Set());

  const calculations = useEditScoreCalculator({
    matchFormat,
    completedSets: completedSets as CompletedSet[],
    editableCompletedSets: state.editableCompletedSets,
    currentServer,
    state,
    tiebreakP1: state.tiebreakP1,
    tiebreakP2: state.tiebreakP2,
  });

  const { validation, tiebreakValidation, matchState, canAddNextSet, canConfirmSet: canConfirmSetCalc, partial, isPotentialMTSet } = calculations;
  const { tiebreakComplete, tiebreakImpossible, tiebreakP1Num, tiebreakP2Num } = tiebreakValidation;
  const { p1Val, p2Val, bothFilled, isSetTrulyCompleted, hasTiebreak, isMatchTiebreakSet } = validation;
  const { matchWouldEnd } = matchState;

  // Reset state ONLY when:
  //   (a) the modal transitions from closed -> open, OR
  //   (b) the *content* of completedSets changes (not just array identity).
  // This prevents production re-renders (which create new completedSets arrays)
  // from wiping out the user's in-progress selections (inputs, points, newSets).
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const completedSetsKey = completedSets
      .map(cs => `${cs.games.player1}-${cs.games.player2}-${cs.winner}${cs.tiebreakScore ? `:${cs.tiebreakScore.player1}-${cs.tiebreakScore.player2}` : ""}`)
      .join("|");
    const completedSetsChanged = completedSetsKey !== lastCompletedSetsKeyRef.current;

    if (justOpened) {
      setState(_prev => ({
        ...createInitialEditScoreState(currentServer),
        editableCompletedSets: completedSets.map((cs) => ({
          p1Games: cs.games.player1,
          p2Games: cs.games.player2,
          isPartial: false,
          tiebreakScore: cs.tiebreakScore,
        })),
      }));
      setConfirmError(null);
      setFloorValidationError(null);
      setIsConfirming(false);
      initializedRef.current = false;
      initialGameRef.current = null;
      inputTouchedRef.current = { p1: false, p2: false };
      lastCompletedSetsKeyRef.current = completedSetsKey;
      editedCompletedSetIndicesRef.current = new Set();
    } else if (isOpen && completedSetsChanged) {
      // Only the completed sets changed (new set added externally); sync the
      // editableCompletedSets without wiping the user's input/points/newSets.
      // Bug (2026-09-07): if the user has already edited one or more
      // completed sets in this session (handleEditCompletedSet), preserve
      // those local edits instead of overwriting them with the incoming
      // prop values — otherwise an external update arriving mid-edit
      // (e.g. another device/socket) silently discards the user's
      // in-progress correction.
      setState(prev => ({
        ...prev,
        editableCompletedSets: completedSets.map((cs, index) => {
          if (editedCompletedSetIndicesRef.current.has(index) && prev.editableCompletedSets[index]) {
            return prev.editableCompletedSets[index];
          }
          return {
            p1Games: cs.games.player1,
            p2Games: cs.games.player2,
            isPartial: false,
            tiebreakScore: cs.tiebreakScore,
          };
        }),
      }));
      setConfirmError(null);
      setFloorValidationError(null);
      lastCompletedSetsKeyRef.current = completedSetsKey;
    } else if (!isOpen) {
      initializedRef.current = false;
      initialGameRef.current = null;
      inputTouchedRef.current = { p1: false, p2: false };
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentServer, completedSets]);

  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      setState(prev => ({
        ...prev,
        p1Input: currentSets.player1.toString(),
        p2Input: currentSets.player2.toString(),
      }));

      const gamePoints = currentGamePoints;
      if (gamePoints) {
        const p1 = typeof gamePoints.player1 === "number" ? gamePoints.player1.toString() : gamePoints.player1;
        const p2 = typeof gamePoints.player2 === "number" ? gamePoints.player2.toString() : gamePoints.player2;
        if (isTiebreak) {
          // O set já está em 6-6 (ou 4-4 no short set) e o tie-break está
          // em andamento: os "pontos de game" atuais SÃO os pontos do
          // tie-break, então pré-preenchemos o campo de Tie-Break em vez
          // de "Pontos no Game Atual" (que não é exibido neste caso).
          initialGameRef.current = { player1: p1, player2: p2 };
          setState(prev => ({ ...prev, tiebreakP1: p1, tiebreakP2: p2 }));
        } else {
          initialGameRef.current = { player1: p1, player2: p2 };
          setState(prev => ({ ...prev, p1Points: p1, p2Points: p2 }));
        }
      }

      initializedRef.current = true;
    }
  }, [isOpen, currentSets, currentGamePoints, isTiebreak]);

  const prevIsMatchTiebreakSetRef = useRef(false);

  useEffect(() => {
    // When potential MT activates (BO5 5th set reaches 6-6), reset inputs to 0/0 for MT points
    if (isMatchTiebreakSet && !prevIsMatchTiebreakSetRef.current) {
      // Only reset if the previous state was a potential MT (games were 6/6) or if inputs look like game scores
      if (p1Val === 6 && p2Val === 6) {
        setState(prev => ({
          ...prev,
          p1Input: "0",
          p2Input: "0",
          tiebreakP1: "",
          tiebreakP2: "",
        }));
      }
    }
    prevIsMatchTiebreakSetRef.current = isMatchTiebreakSet;
  }, [isMatchTiebreakSet, p1Val, p2Val]);

  const handleGameInputChange = useCallback((value: string, setter: (v: string) => void, player: 'p1' | 'p2', otherInput?: string): void => {
    inputTouchedRef.current[player] = true;
    setConfirmError(null);
    setFloorValidationError(null);
    if (value === "") {
      setter("");
      setState(prev => ({ ...prev, tiebreakP1: "", tiebreakP2: "" }));
      return;
    }
    if (!/^\d+$/.test(value)) return;
    const num = parseInt(value, 10);
    const otherGames = otherInput ? (parseInt(otherInput, 10) || 0) : 0;
    // Match Tiebreak (qualquer formato): pontos vão até o máximo de MT (30);
    // getMaxValidGames só cobre placares de games (cap = tiebreakAt + 1).
    const maxGames = isMatchTiebreakSet
      ? SCORING_LIMITS.TIEBREAK_INPUT_CAP
      : getMaxValidGames(otherGames, matchFormat);
    setter(num > maxGames ? String(maxGames) : num.toString());
    setState(prev => ({ ...prev, tiebreakP1: "", tiebreakP2: "" }));
  }, [matchFormat, isMatchTiebreakSet]);

  const handleConfirm = useCallback(async () => {
    setConfirmError(null);

    if (tiebreakImpossible) {
      setConfirmError("Placar de tiebreak impossível — ajuste para um valor válido");
      return;
    }

    // If inputs are empty (or untouched 0x0 pre-fill) but there are existing
    // sets (completed edited by the user or pending newSets), save all sets —
    // the modal exists to edit the score, so confirming must not require a
    // new unfinished set.
    const scoresAreZero = bothFilled && p1Val === 0 && p2Val === 0;
    const existingSets = [...getCompletedSets(state, completedSets, matchFormat), ...state.newSets];
    if ((!bothFilled || scoresAreZero) && existingSets.length > 0) {
      // Bug (2026-09-07): recalcular o sacador a partir do placar EDITADO
      // (existingSets, que já reflete correções feitas via
      // handleEditCompletedSet) em vez de repassar `currentServer` sem
      // ajuste. Sem isso, corrigir o placar de um set já concluído (sem
      // adicionar um set novo) salva o placar certo mas mantém o sacador
      // calculado para o placar antigo, que pode estar errado se a
      // correção mudou a paridade de games da partida.
      const lastExistingSet = existingSets[existingSets.length - 1];
      const priorExistingSets = existingSets.slice(0, -1).map((s) => ({
        games: { player1: s.p1Games, player2: s.p2Games } as Record<'player1' | 'player2', number>,
        winner: (s.p1Games > s.p2Games ? 'player1' : 'player2') as 'player1' | 'player2',
        ...(s.tiebreakScore ? { tiebreakScore: s.tiebreakScore } : {}),
      }));
      const recalculatedServer = calculateNextServer({
        currentServer,
        p1Games: lastExistingSet.p1Games,
        p2Games: lastExistingSet.p2Games,
        matchFormat,
        tiebreakScore: lastExistingSet.tiebreakScore ?? null,
        completedSets: priorExistingSets,
      });
      setIsConfirming(true);
      try {
        onConfirm(existingSets, recalculatedServer || currentServer);
      } finally {
        setIsConfirming(false);
      }
      return;
    }

    // If inputs are empty and no pending newSets, show error
    if (!bothFilled) {
      setConfirmError("Informe o placar do set");
      return;
    }
    
    if (onRefreshFloor && floorCurrentSets && !isSetTrulyCompleted) {
      const freshError = await getFreshFloorError(onRefreshFloor, floorCurrentSets, isSetTrulyCompleted, p1Val, p2Val);
      if (freshError) {
        setConfirmError(freshError);
        return;
      }
    }
    
    if (floorValidationError) {
      setConfirmError(floorValidationError);
      return;
    }
    if (validation.setValidationError && !partial) {
      setConfirmError(validation.setValidationError);
      return;
    }

    // Bug (2026-09-07) — CRÍTICO: esta checagem só faz sentido quando o
    // placar de games (p1Val/p2Val) já define um vencedor por si só (ex.:
    // 7-6 digitado diretamente). No fluxo normal de um set decidido em
    // 6-6 + tiebreak, p1Val === p2Val === 6 — não há "vencedor pelos games"
    // para comparar. Antes, `setWinner = p1Val > p2Val ? ... : "player2"`
    // resolvia SEMPRE para "player2" nesse caso (6 não é maior que 6),
    // então sempre que o player1 vencia o tiebreak decisivo, esta
    // validação disparava um erro falso e bloqueava a confirmação do set
    // (e, se fosse o set da partida, o encerramento da partida inteiro).
    if (bothFilled && hasTiebreak && isSetTrulyCompleted && tiebreakComplete && p1Val !== p2Val) {
      const setWinner = p1Val > p2Val ? "player1" : "player2";
      const tiebreakWinner = tiebreakP1Num > tiebreakP2Num ? "player1" : "player2";
      if (setWinner !== tiebreakWinner) {
        setConfirmError("Vencedor do tiebreak não corresponde ao vencedor do set.");
        return;
      }
    }

    if (bothFilled) {
      const floorError = getFloorError(p1Val, p2Val, floorCurrentSets);
      if (floorError) {
        setConfirmError(floorError);
        return;
      }
    }

    // Validar pontos do tiebreak contra o floor. Quando o set está em
    // tiebreak (6x6), floorCurrentSets contém os pontos do tiebreak (ex.:
    // 2-3). Comparar diretamente com os inputs de tiebreak.
    if (bothFilled && hasTiebreak && floorCurrentSets && !isSetTrulyCompleted) {
      const tbFloorP1 = floorCurrentSets.player1;
      const tbFloorP2 = floorCurrentSets.player2;
      const currentTbP1 = Number(state.tiebreakP1) || 0;
      const currentTbP2 = Number(state.tiebreakP2) || 0;
      if (currentTbP1 < tbFloorP1 || currentTbP2 < tbFloorP2) {
        setConfirmError(`Placar do tiebreak não pode ser inferior ao ponto de parada (${tbFloorP1}x${tbFloorP2}).`);
        return;
      }
    }

    if (!isSetTrulyCompleted && initialGameRef.current) {
      const sameSetScore = p1Val === currentSets.player1 && p2Val === currentSets.player2;
      if (sameSetScore) {
        const initial = initialGameRef.current;
        const oldP1 = pointToProgress(parsePointValue(initial.player1));
        const oldP2 = pointToProgress(parsePointValue(initial.player2));
        const newP1 = pointToProgress(parsePointValue(state.p1Points));
        const newP2 = pointToProgress(parsePointValue(state.p2Points));
        if ((newP1 < oldP1 && newP2 <= oldP2) || (newP2 < oldP2 && newP1 <= oldP1)) {
          setConfirmError("Placar não pode ser inferior ao estado atual");
          return;
        }
      }
    }

    // Validar que pontos do tiebreak não sejam inferiores ao estado atual.
    // Quando o set está em tiebreak (6x6), as "game points" iniciais são os
    // pontos do tiebreak (ex.: 2-3). Se o usuário reduz o placar do
    // tiebreak, bloquear.
    if (!isSetTrulyCompleted && hasTiebreak && initialGameRef.current) {
      const initialTbP1 = Number(initialGameRef.current.player1) || 0;
      const initialTbP2 = Number(initialGameRef.current.player2) || 0;
      const currentTbP1 = Number(state.tiebreakP1) || 0;
      const currentTbP2 = Number(state.tiebreakP2) || 0;
      if (p1Val === currentSets.player1 && p2Val === currentSets.player2) {
        if ((currentTbP1 < initialTbP1 && currentTbP2 <= initialTbP2) ||
            (currentTbP2 < initialTbP2 && currentTbP1 <= initialTbP1)) {
          setConfirmError("Placar do tiebreak não pode ser inferior ao estado atual");
          return;
        }
      }
    }

    const setData = createSetEditData({
      p1Val, p2Val, isSetTrulyCompleted, hasTiebreak,
      tiebreakP1Num: tiebreakP1Num ?? 0, tiebreakP2Num: tiebreakP2Num ?? 0,
      isMatchTiebreakSet, isPotentialMTSet, p1Points: state.p1Points,
      p2Points: state.p2Points, currentSets, matchFormat,
    });

    // Bug (2026-09-07): usar toCompletedSetsForServer (que honra
    // state.editableCompletedSets) em vez da prop `completedSets` crua —
    // caso contrário, corrigir o placar de um set já concluído e depois
    // confirmar um set novo salva o placar certo mas calcula o sacador com
    // base no set NÃO editado.
    const allCompletedSetsForServer: CompletedSet[] = [
      ...toCompletedSetsForServer(state, completedSets, matchFormat),
      ...state.newSets.map((ns) => ({
        games: { player1: ns.p1Games, player2: ns.p2Games } as Record<'player1' | 'player2', number>,
        winner: (ns.p1Games > ns.p2Games ? 'player1' : 'player2') as 'player1' | 'player2',
        tiebreakScore: ns.tiebreakScore,
      })),
    ];
    let nextServer = calculateNextServer({
      currentServer,
      p1Games: p1Val,
      p2Games: p2Val,
      matchFormat,
      tiebreakScore: tiebreakComplete ? { player1: tiebreakP1Num, player2: tiebreakP2Num } : null,
      completedSets: allCompletedSetsForServer,
    });
    nextServer = nextServer || currentServer;

    // Bug (2026-09-07) — CRÍTICO: handleConfirm já dispara onConfirm +
    // onMatchFinished de uma vez só quando o set atual encerra a partida.
    // Antes, o código também setava `isFinishingMatch(true)`, o que trocava
    // o rodapé do modal para o botão "Registrar encerramento"
    // (handleFinishMatch) — que, se clicado, disparava onConfirm +
    // onMatchFinished NOVAMENTE (duplo processamento / possível
    // persistência ou finalização duplicada no backend). Como este bloco já
    // finaliza a partida por completo em uma única chamada, o fluxo de
    // segunda etapa foi removido (ver também EditScoreModal.tsx).
    const allNewSetsForConfirm = [...state.newSets, setData];
    const allSets = [...getCompletedSets(state, completedSets, matchFormat), ...allNewSetsForConfirm];
    setIsConfirming(true);
    try {
      onConfirm(allSets, nextServer);

      if (matchWouldEnd && isSetTrulyCompleted && onMatchFinished) {
        // Bug (2026-09-07) — CRÍTICO: `p1Val > p2Val` resolve incorretamente
        // para "player2" quando o set termina 6-6 + tiebreak (p1Val===p2Val),
        // atribuindo a vitória da partida ao jogador errado sempre que o
        // player1 vencia o tiebreak decisivo. Usar getEffectiveSetWinner, que
        // consulta o placar do tiebreak quando os games estão empatados.
        const winner = getEffectiveSetWinner(validation) ?? (p1Val > p2Val ? "player1" : "player2");
        onMatchFinished(winner);
      }

      setState(prev => ({
        ...prev,
        newSets: [...prev.newSets, setData],
        p1Input: "",
        p2Input: "",
        tiebreakP1: "",
        tiebreakP2: "",
        p1Points: "0",
        p2Points: "0",
        nextServer: nextServer || prev.nextServer,
      }));
      inputTouchedRef.current = { p1: false, p2: false };
    } finally {
      setIsConfirming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable deps: createSetEditData (module fn), matchState/playerNames (derived stable objects)
  }, [onRefreshFloor, floorCurrentSets, isSetTrulyCompleted, p1Val, p2Val,
    floorValidationError, validation, partial, hasTiebreak, tiebreakComplete, tiebreakImpossible,
    tiebreakP1Num, tiebreakP2Num, matchWouldEnd, currentServer,
    state, completedSets, matchFormat,
    bothFilled, isMatchTiebreakSet, isPotentialMTSet,
    onConfirm, onMatchFinished]);

  const handleCancel = useCallback(() => {
    if (isConfirming) return;
    onCancel();
  }, [onCancel, isConfirming]);

  const handleAddSet = useCallback(() => {
    if (!canAddNextSet) return;

    const p1Games = parseInt(state.p1Input, 10) || 0;
    const p2Games = parseInt(state.p2Input, 10) || 0;
    const tbP1Num = parseInt(state.tiebreakP1, 10);
    const tbP2Num = parseInt(state.tiebreakP2, 10);
    // Include tiebreakScore whenever the inputs are valid numbers (even 0-0).
    // Previously required > 0 which excluded a tiebreak that just started —
    // Bug #12. In practice, canAddNextSet gates this so the tiebreak is
    // always complete before handleAddSet runs, but this is safer.
    const hasTiebreakScore =
      !isNaN(tbP1Num) && !isNaN(tbP2Num) &&
      tbP1Num >= 0 && tbP2Num >= 0;

    const setData: SetEditData = {
      p1Games,
      p2Games,
      isPartial: false,
      ...(hasTiebreakScore
        ? { tiebreakScore: { player1: tbP1Num, player2: tbP2Num } }
        : {}),
    };

    // For MT sets, p1Games/p2Games ARE the tiebreak points, so pass them
    // as tiebreakScore to ensure correct server calculation.
    const tiebreakForServer = isMatchTiebreakSet
      ? { player1: p1Games, player2: p2Games }
      : hasTiebreakScore
        ? { player1: tbP1Num, player2: tbP2Num }
        : null;

    setState(prev => ({
      ...prev,
      newSets: [...prev.newSets, setData],
      p1Input: "",
      p2Input: "",
      tiebreakP1: "",
      tiebreakP2: "",
      nextServer: calculateNextServer({
        currentServer,
        p1Games,
        p2Games,
        matchFormat,
        tiebreakScore: tiebreakForServer,
        // Bug (2026-09-07): idem handleConfirm — usar os sets já editados
        // pelo usuário, não a prop crua.
        completedSets: toCompletedSetsForServer(state, completedSets, matchFormat),
      }),
    }));
  }, [canAddNextSet, state, currentServer, matchFormat, completedSets, isMatchTiebreakSet]);

  const handlePointsChange = useCallback((p1: string, p2: string) => {
    setState(prev => ({ ...prev, p1Points: p1, p2Points: p2 }));
  }, []);

  const handleEditCompletedSet = useCallback((index: number, p1Games: number, p2Games: number) => {
    // FIX #4: Validar inline antes de atualizar o estado. Impedir placares
    // inválidos como 99-99, -5-3, ou set sem vencedor claro.
    const validation = validateSetResult({ p1Games, p2Games }, matchFormat);
    if (validation.error && !validation.isPartial) {
      setConfirmError(validation.error);
      return;
    }
    editedCompletedSetIndicesRef.current.add(index);
    setState(prev => {
      const newEditable = [...prev.editableCompletedSets];
      if (newEditable[index]) {
        newEditable[index] = { ...newEditable[index], p1Games, p2Games };
      }
      return { ...prev, editableCompletedSets: newEditable };
    });
    setConfirmError(null);
    setFloorValidationError(null);
  }, [matchFormat]);

  const handleConfirmSet = useCallback(() => {
    if (!canConfirmSetCalc) return;
    if (isMatchTiebreakSet) {
      // MT: just confirm the current set (don't add to newSets, match ends)
      handleConfirm();
      return;
    }
    handleAddSet();
    setState(prev => ({
      ...prev,
      p1Input: "",
      p2Input: "",
      tiebreakP1: "",
      tiebreakP2: "",
      p1Points: "0",
      p2Points: "0",
    }));
    inputTouchedRef.current = { p1: false, p2: false };
  }, [canConfirmSetCalc, isMatchTiebreakSet, handleAddSet, handleConfirm]);

  const resetState = useCallback(() => {
    setState({
      ...createInitialEditScoreState(currentServer),
      editableCompletedSets: completedSets.map((cs) => ({
        p1Games: cs.games.player1,
        p2Games: cs.games.player2,
        isPartial: false,
        tiebreakScore: cs.tiebreakScore,
      })),
    });
    setConfirmError(null);
    setFloorValidationError(null);
    initializedRef.current = false;
  }, [currentServer, completedSets]);

  // Bug (2026-09-07) — CRÍTICO: o fluxo de segunda etapa (isFinishingMatch +
  // handleFinishMatch + botão "Registrar encerramento") foi removido.
  // handleConfirm já finaliza a partida completamente em uma única chamada
  // (onConfirm + onMatchFinished) quando o set digitado encerra a partida;
  // manter uma segunda etapa que repetia essas mesmas chamadas arriscava
  // duplo processamento (persistência/finalização duplicada) caso o modal
  // permanecesse aberto e o usuário clicasse em "Registrar encerramento"
  // após o primeiro clique em "Confirmar" já ter concluído tudo.

return {
    state,
    setState,
    confirmError,
    floorValidationError,
    isConfirming,
    calculations,
    handleGameInputChange,
    handleConfirm,
    handleCancel,
    handleAddSet,
    handleConfirmSet,
    canConfirmSet: canConfirmSetCalc,
    handlePointsChange,
    handleEditCompletedSet,
    resetState,
  };
}