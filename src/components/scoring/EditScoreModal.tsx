"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "./editScoreHelpers";
import type { CompletedSet } from "./edit-score-logic";
import {
  createInitialEditScoreState,
  createSetEditData,
  shouldAutoAddSet,
  calculateNextServer,
} from "./edit-score-logic";
import { parsePointValue, toDisplayPoint, pointProgressToIndex, pointToProgress } from "@/core/scoring/point-utils"; // CORREÇÃO #3: Funções unificadas
import { useEditScoreCalculator } from "./use-edit-score-calculator";
import { SetsSummary, MatchSummary } from "./edit-score-summary";
import { SetInputForm } from "./edit-score-form";

type Player = "player1" | "player2";

interface EditScoreModalProps {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: Player;
  completedSets?: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  floorCurrentSets?: { player1: number; player2: number } | null;
  onConfirm: (setResults: SetEditData[], server: Player) => void;
  onCancel: () => void;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  suspendedSession?: {
    bankScoreState?: {
      sets?: Array<{
        player1: number;
        player2: number;
        isTiebreak: boolean;
        tiebreakScore?: { player1: number; player2: number } | null;
      }>;
    } | null;
  } | null;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>; // CORREÇÃO #2: Refetch floor
}

export function EditScoreModal({
  isOpen,
  matchFormat,
  playerNames,
  currentSets,
  currentServer,
  completedSets = [],
  currentGamePoints,
  floorCurrentSets = null,
  onConfirm,
  onCancel,
  onMatchFinished,
  suspendedSession = null,
  onRefreshFloor, // CORREÇÃO #2: Refetch floor
}: EditScoreModalProps) {
  const [state, setState] = useState(() => createInitialEditScoreState(currentServer));
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);
  const [isFinishingMatch, setIsFinishingMatch] = useState(false);

  const initializedRef = useRef(false);
  const initialGameRef = useRef<{ player1: string; player2: string } | null>(null);

  const calculations = useEditScoreCalculator({
    matchFormat,
    completedSets: completedSets as CompletedSet[],
    currentServer,
    state,
    tiebreakP1: state.tiebreakP1,
    tiebreakP2: state.tiebreakP2,
  });

  const { validation, tiebreakValidation, matchState, canAddNextSet, canConfirm, partial } = calculations;
  const { tiebreakComplete, tiebreakP1Num, tiebreakP2Num } = tiebreakValidation;
  const { p1Val, p2Val, bothFilled, isSetTrulyCompleted, hasTiebreak, isMatchTiebreakSet } = validation;
  const { matchAlreadyOver, matchWouldEnd, totalEditedSets, maxSets, setsToWin, p1SetsWon, p2SetsWon } = matchState;

  useEffect(() => {
    if (isOpen) {
      setState(createInitialEditScoreState(currentServer));
      setConfirmError(null);
      setFloorValidationError(null);
      initializedRef.current = false;
    } else {
      initializedRef.current = false;
    }
  }, [isOpen, currentServer]);

  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      setState(prev => ({
        ...prev,
        p1Input: currentSets.player1.toString(),
        p2Input: currentSets.player2.toString(),
        p1Points: toDisplayPoint(currentGamePoints?.player1),
        p2Points: toDisplayPoint(currentGamePoints?.player2),
      }));
      initialGameRef.current = {
        player1: toDisplayPoint(currentGamePoints?.player1),
        player2: toDisplayPoint(currentGamePoints?.player2),
      };
      initializedRef.current = true;
    }
  }, [isOpen, completedSets.length, currentSets.player1, currentSets.player2, currentGamePoints]);

  useEffect(() => {
    if (!bothFilled) return;
    const gamesChanged = p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
    const hasGamePoints = state.p1Points !== "0" || state.p2Points !== "0";
    
    if (gamesChanged) {
      setState(prev => ({ ...prev, p1Points: "0", p2Points: "0" }));
      initialGameRef.current = { player1: "0", player2: "0" };
      
      // CORREÇÃO #4: Setar aviso quando pontos forem descartados
      if (hasGamePoints && !isSetTrulyCompleted) {
        setConfirmError("⚠️ Pontos do game atual foram zerados devido à mudança no placar de games");
      }
    }
  }, [bothFilled, p1Val, p2Val, currentSets, state.p1Points, state.p2Points, isSetTrulyCompleted]);

  useEffect(() => {
    if (!hasTiebreak) {
      setState(prev => ({ ...prev, tiebreakP1: "", tiebreakP2: "" }));
    }
  }, [hasTiebreak]);

  useEffect(() => {
    if (bothFilled && floorCurrentSets && !isSetTrulyCompleted) {
      const hasIncompleteTiebreak = suspendedSession?.bankScoreState?.sets?.some(
        (set) => set.isTiebreak && set.tiebreakScore && 
        Math.abs(set.tiebreakScore.player1 - set.tiebreakScore.player2) < 2 &&
        (set.tiebreakScore.player1 >= 7 || set.tiebreakScore.player2 >= 7)
      );
      
      if (hasIncompleteTiebreak && suspendedSession?.bankScoreState?.sets) {
        const tbSet = suspendedSession.bankScoreState.sets.find(
          (s) => s.isTiebreak && s.tiebreakScore
        );
        
        if (tbSet && tbSet.tiebreakScore) {
          if (p1Val < tbSet.tiebreakScore.player1 || p2Val < tbSet.tiebreakScore.player2) {
            setFloorValidationError(
              `Tie-break em andamento: ${tbSet.tiebreakScore.player1}x${tbSet.tiebreakScore.player2} — placar não pode regredir`,
            );
            return;
          }
        }
      }
      
      if (p1Val < floorCurrentSets.player1 || p2Val < floorCurrentSets.player2) {
        setFloorValidationError(
          `Placar não pode ser inferior ao ponto de parada (${floorCurrentSets.player1}x${floorCurrentSets.player2}). Use com cautela.`,
        );
      } else {
        setFloorValidationError(null);
      }
    } else {
      setFloorValidationError(null);
    }
  }, [bothFilled, p1Val, p2Val, floorCurrentSets, isSetTrulyCompleted, suspendedSession]);

  const handleGameInputChange = useCallback((value: string, setter: (v: string) => void): void => {
    setConfirmError(null);
    setFloorValidationError(null);
    if (value === "") {
      setter("");
      setState(prev => ({ ...prev, tiebreakP1: "", tiebreakP2: "", p1Points: "0", p2Points: "0" }));
      return;
    }
    if (!/^\d+$/.test(value)) return;
    const num = parseInt(value, 10);
    setter(num > 50 ? "50" : value.replace(/^0+(?=[1-9]|$)/, ""));
    setState(prev => ({ ...prev, tiebreakP1: "", tiebreakP2: "", p1Points: "0", p2Points: "0" }));
  }, []);

  const handleAddSet = useCallback(() => {
    if (!isSetTrulyCompleted) return;
    if (matchWouldEnd) return;
    if (totalEditedSets >= maxSets - 1) return;
    if (matchAlreadyOver) return;
    if (isMatchTiebreakSet) return;

    const scoreWasChanged = p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
    if (!scoreWasChanged) return;

    const setData = createSetEditData(
      p1Val, p2Val, isSetTrulyCompleted, hasTiebreak,
      tiebreakP1Num, tiebreakP2Num, isMatchTiebreakSet,
      state.p1Points, state.p2Points, currentSets
    );

    const newList = [...state.newSets, setData];
    setState(prev => ({
      ...prev,
      newSets: newList,
      p1Input: "",
      p2Input: "",
      tiebreakP1: "",
      tiebreakP2: "",
    }));

    const next = calculateNextServer(
      currentServer,
      p1Val,
      p2Val,
      matchFormat,
      setData.tiebreakScore ?? null,
      completedSets as CompletedSet[],
    );
    setState(prev => ({ ...prev, nextServer: next }));
  }, [
    isSetTrulyCompleted, matchWouldEnd, totalEditedSets, maxSets, matchAlreadyOver,
    isMatchTiebreakSet, p1Val, p2Val, currentSets, hasTiebreak, tiebreakP1Num,
    tiebreakP2Num, state.p1Points, state.p2Points, state.newSets, currentServer,
    matchFormat, completedSets,
  ]);

  const prevCanAddNextSetRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      prevCanAddNextSetRef.current = false;
      return;
    }
    if (canAddNextSet && !prevCanAddNextSetRef.current && initializedRef.current) {
      handleAddSet();
    }
    prevCanAddNextSetRef.current = canAddNextSet;
  }, [isOpen, canAddNextSet, handleAddSet]);

  const handleConfirm = useCallback(async () => {
    setConfirmError(null);
    
    // CORREÇÃO #2: Refetch do floor antes de confirmar para evitar race condition
    if (onRefreshFloor && floorCurrentSets && !isSetTrulyCompleted) {
      try {
        const freshFloor = await onRefreshFloor();
        if (freshFloor) {
          // Validar com floor atualizado
          if (p1Val < freshFloor.player1 || p2Val < freshFloor.player2) {
            setConfirmError(
              `Placar atualizado: ${freshFloor.player1}x${freshFloor.player2}. Seu placar (${p1Val}x${p2Val}) é inferior.`
            );
            return;
          }
        }
      } catch (err) {
        console.error('[handleConfirm] Failed to refresh floor:', err);
        // Continuar com validação local se refetch falhar
      }
    }
    
    if (floorValidationError) return;
    if (validation.setValidationError && !partial) return;
    if (validation.setValidation?.tiebreakRequired) return;

    if (bothFilled && hasTiebreak && isSetTrulyCompleted && tiebreakComplete) {
      const setWinner = p1Val > p2Val ? "player1" : "player2";
      const tiebreakWinner = tiebreakP1Num > tiebreakP2Num ? "player1" : "player2";
      if (setWinner !== tiebreakWinner) {
        setConfirmError("Vencedor do tiebreak não corresponde ao vencedor do set.");
        return;
      }
    }

    if (isSetTrulyCompleted && matchWouldEnd) {
      const wouldBeP1Sets = matchState.p1SetsWonFromProp + matchState.newP1SetsWon + (validation.setValidation?.winner === "player1" ? 1 : 0);
      const wouldBeP2Sets = matchState.p2SetsWonFromProp + matchState.newP2SetsWon + (validation.setValidation?.winner === "player2" ? 1 : 0);
      if (wouldBeP1Sets > setsToWin || wouldBeP2Sets > setsToWin) {
        setConfirmError(
          `Partida já encerrou com ${setsToWin} sets para ${wouldBeP1Sets > setsToWin ? playerNames.p1 : playerNames.p2}.`,
        );
        return;
      }
    }

    if (bothFilled && floorCurrentSets && !isSetTrulyCompleted) {
      if (p1Val < floorCurrentSets.player1 || p2Val < floorCurrentSets.player2) {
        setConfirmError(
          `Placar não pode ser inferior ao ponto de parada (${floorCurrentSets.player1}x${floorCurrentSets.player2}).`,
        );
        return;
      }
    }

    if (isSetTrulyCompleted && !matchWouldEnd && !canAddNextSet && maxSets > 1) {
      return;
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

    const existingCompleted: SetEditData[] = completedSets.map((cs) => ({
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
    }));
    const finalSets = [...existingCompleted, ...state.newSets];
    
    if (bothFilled) {
      const setData = createSetEditData(
        p1Val, p2Val, isSetTrulyCompleted, hasTiebreak,
        tiebreakP1Num, tiebreakP2Num, isMatchTiebreakSet,
        state.p1Points, state.p2Points, currentSets
      );
      finalSets.push(setData);
    }
    
    const matchWinner = p1SetsWon >= setsToWin ? "player1" : p2SetsWon >= setsToWin ? "player2" : null;
    
    // CORREÇÃO #6: isFinishingMatch atômico - setar antes de chamar onConfirm
    if (matchWinner) {
      setIsFinishingMatch(true);
    }
    
    try {
      onConfirm(finalSets, state.nextServer);
      
      if (matchWinner && onMatchFinished) {
        onMatchFinished(matchWinner);
      }
      
      // Reset após 1s apenas se sucesso
      setTimeout(() => setIsFinishingMatch(false), 1000);
    } catch (err) {
      console.error('[handleConfirm] Error:', err);
      setConfirmError('Erro ao confirmar placar. Tente novamente.');
      setIsFinishingMatch(false); // Reset imediato em caso de erro
    }
  }, [
    floorValidationError, validation, partial, hasTiebreak, isSetTrulyCompleted,
    tiebreakComplete, p1Val, p2Val, tiebreakP1Num, tiebreakP2Num, matchWouldEnd,
    matchState, setsToWin, playerNames, floorCurrentSets, canAddNextSet, maxSets,
    currentSets, state.p1Points, state.p2Points, state.newSets, state.nextServer,
    completedSets, isMatchTiebreakSet, bothFilled, p1SetsWon, p2SetsWon,
    onConfirm, onMatchFinished, confirmError, onRefreshFloor,
  ]);

  if (!isOpen) return null;

  const convertedCompletedSets = completedSets.map(cs => ({
    p1Games: cs.games.player1,
    p2Games: cs.games.player2,
    winner: cs.winner,
  }));

  const newSetsAsCompleted = state.newSets.map(set => ({
    p1Games: set.p1Games,
    p2Games: set.p2Games,
    winner: set.p1Games > set.p2Games ? "player1" as Player : "player2" as Player,
  }));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="bg-gray-800 border-2 border-blue-500 rounded-xl max-w-[420px] w-[clamp(300px,85vw,420px)] mx-4 shadow-2xl animate-[slideUp_300ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Ajustar Placar</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-gray-200 text-sm">
            Informe o placar para continuar a anotação de onde parou.
          </p>

          {completedSets.length > 0 && (
            <SetsSummary
              title="Sets Finalizados"
              sets={convertedCompletedSets}
              playerNames={playerNames}
              startIndex={0}
            />
          )}

          {state.newSets.length > 0 && (
            <SetsSummary
              title="Sets Adicionados"
              sets={newSetsAsCompleted}
              playerNames={playerNames}
              startIndex={completedSets.length}
            />
          )}

          {matchAlreadyOver && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-300">
              O placar atual já encerrou a partida — não é possível adicionar mais sets.
            </div>
          )}

          {totalEditedSets < maxSets && !matchAlreadyOver && (
            <SetInputForm
              matchFormat={matchFormat}
              totalEditedSets={totalEditedSets}
              playerNames={playerNames}
              p1Input={state.p1Input}
              p2Input={state.p2Input}
              p1Points={state.p1Points}
              p2Points={state.p2Points}
              tiebreakP1={state.tiebreakP1}
              tiebreakP2={state.tiebreakP2}
              floorCurrentSets={floorCurrentSets}
              floorValidationError={floorValidationError}
              isMatchTiebreakSet={isMatchTiebreakSet}
              hasTiebreak={hasTiebreak}
              isSetTrulyCompleted={isSetTrulyCompleted}
              tiebreakComplete={tiebreakComplete}
              partial={partial}
              p1Val={p1Val}
              p2Val={p2Val}
              validationError={validation.setValidationError}
              onP1InputChange={(v) => handleGameInputChange(v, (val) => setState(prev => ({ ...prev, p1Input: val })))}
              onP2InputChange={(v) => handleGameInputChange(v, (val) => setState(prev => ({ ...prev, p2Input: val })))}
              onP1PointsChange={(v) => setState(prev => ({ ...prev, p1Points: v }))}
              onP2PointsChange={(v) => setState(prev => ({ ...prev, p2Points: v }))}
              onTiebreakP1Change={(v) => setState(prev => ({ ...prev, tiebreakP1: v }))}
              onTiebreakP2Change={(v) => setState(prev => ({ ...prev, tiebreakP2: v }))}
              onAddSet={handleAddSet}
              canAddNextSet={canAddNextSet}
              matchAlreadyOver={matchAlreadyOver}
              matchWouldEnd={matchWouldEnd}
              p1SetsWon={p1SetsWon}
              p2SetsWon={p2SetsWon}
              maxSets={maxSets}
            />
          )}

          <MatchSummary
            playerNames={playerNames}
            p1SetsWon={p1SetsWon}
            p2SetsWon={p2SetsWon}
            setsToWin={setsToWin}
          />
        </div>

        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          {confirmError && (
            <p
              className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2"
              role="alert"
            >
              {confirmError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || !!floorValidationError || isFinishingMatch}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isFinishingMatch ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Finalizando...
                </>
              ) : (
                "Confirmar Placar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}