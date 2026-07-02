"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "./editScoreHelpers";
import {
  validateSetResult,
  isBelowFloor,
  setsToWinForFormat,
  totalSetsForFormat,
  getNextServerAfterSet,
} from "./editScoreHelpers";

type Player = "player1" | "player2";

const GAME_POINTS = ["0", "15", "30", "40", "AD"] as const;

interface CompletedSet {
  games: Record<Player, number>;
  winner: Player;
}

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
}: EditScoreModalProps) {
  const [newSets, setNewSets] = useState<SetEditData[]>([]);
  const [p1Input, setP1Input] = useState("");
  const [p2Input, setP2Input] = useState("");
  const [p1Points, setP1Points] = useState<string>("0");
  const [p2Points, setP2Points] = useState<string>("0");
  const [nextServer, setNextServer] = useState<Player>(currentServer);
  const [tiebreakP1, setTiebreakP1] = useState<string>("");
  const [tiebreakP2, setTiebreakP2] = useState<string>("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<
    string | null
  >(null);

  const initializedRef = useRef(false);
  const initialGameRef = useRef<{ player1: string; player2: string } | null>(null);

  const maxSets = totalSetsForFormat(matchFormat);
  const setsToWin = setsToWinForFormat(matchFormat);
  const p1Val = p1Input === "" ? NaN : parseInt(p1Input, 10);
  const p2Val = p2Input === "" ? NaN : parseInt(p2Input, 10);
  const bothFilled = !isNaN(p1Val) && !isNaN(p2Val) && p1Val >= 0 && p2Val >= 0;

  const setValidation = useMemo(() => {
    if (!bothFilled) return null;
    return validateSetResult({ p1Games: p1Val, p2Games: p2Val }, matchFormat);
  }, [bothFilled, p1Val, p2Val, matchFormat]);

  const hasWinner = setValidation?.winner !== undefined;
  const completed = hasWinner;
  const setValidationError = completed ? undefined : setValidation?.error;
  const hasTiebreak = setValidation?.hasTiebreak ?? false;
  const totalEditedSets = completedSets.length + newSets.length;
  const p1SetsWonFromProp = completedSets.filter(
    (s) => s.winner === "player1",
  ).length;
  const p2SetsWonFromProp = completedSets.filter(
    (s) => s.winner === "player2",
  ).length;

  const newP1SetsWon = newSets.filter((s) => s.p1Games > s.p2Games).length;
  const newP2SetsWon = newSets.filter((s) => s.p2Games > s.p1Games).length;
  const p1SetsWon =
    p1SetsWonFromProp +
    newP1SetsWon +
    (completed && setValidation?.winner === "player1" ? 1 : 0);
  const p2SetsWon =
    p2SetsWonFromProp +
    newP2SetsWon +
    (completed && setValidation?.winner === "player2" ? 1 : 0);
  const matchAlreadyOver =
    p1SetsWonFromProp >= setsToWin || p2SetsWonFromProp >= setsToWin;
  const matchWouldEnd = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;

  const tiebreakP1Num = parseInt(tiebreakP1, 10);
  const tiebreakP2Num = parseInt(tiebreakP2, 10);
  const hasValidTiebreak =
    !isNaN(tiebreakP1Num) &&
    !isNaN(tiebreakP2Num) &&
    tiebreakP1Num >= 0 &&
    tiebreakP2Num >= 0;
  const tiebreakComplete =
    hasTiebreak &&
    hasValidTiebreak &&
    Math.abs(tiebreakP1Num - tiebreakP2Num) >= 2;

  const canAddNextSet =
    completed &&
    totalEditedSets < maxSets - 1 &&
    !matchAlreadyOver &&
    !matchWouldEnd &&
    (!hasTiebreak || tiebreakComplete);

  useEffect(() => {
    if (isOpen) {
      setNewSets([]);
      setNextServer(currentServer);
      setTiebreakP1("");
      setTiebreakP2("");
      setConfirmError(null);
      setFloorValidationError(null);
      initializedRef.current = false;
    } else {
      initializedRef.current = false;
    }
  }, [isOpen, currentServer]);

  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      setP1Input(currentSets.player1.toString());
      setP2Input(currentSets.player2.toString());
      const toDisplay = (v: number | string | undefined): string => {
        if (v == null) return "0";
        if (v === "AD" || v === "DEUCE" || v === "15" || v === "30" || v === "40") return v;
        const n = typeof v === "number" ? v : parseInt(String(v), 10);
        if (n === 0) return "0";
        if (n === 1) return "15";
        if (n === 2) return "30";
        if (n === 3) return "40";
        if (n === 4) return "AD";
        return "0";
      };
      setP1Points(toDisplay(currentGamePoints?.player1));
      setP2Points(toDisplay(currentGamePoints?.player2));
      initialGameRef.current = {
        player1: toDisplay(currentGamePoints?.player1),
        player2: toDisplay(currentGamePoints?.player2),
      };
      initializedRef.current = true;
    }
  }, [
    isOpen,
    completedSets.length,
    currentSets.player1,
    currentSets.player2,
    currentGamePoints,
  ]);

  useEffect(() => {
    return () => {
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!bothFilled || completed) return;
    const gamesChanged = p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
    const hasGamePoints = p1Points !== "0" || p2Points !== "0";
    if (gamesChanged && hasGamePoints) {
      setP1Points("0");
      setP2Points("0");
      initialGameRef.current = { player1: "0", player2: "0" };
    }
  }, [bothFilled, p1Val, p2Val, currentSets, completed, p1Points, p2Points]);

  useEffect(() => {
    if (!hasTiebreak) {
      setTiebreakP1("");
      setTiebreakP2("");
    }
  }, [hasTiebreak, p1Val, p2Val]);

  useEffect(() => {
    if (bothFilled && floorCurrentSets && !completed) {
      if (
        p1Val < floorCurrentSets.player1 ||
        p2Val < floorCurrentSets.player2
      ) {
        setFloorValidationError(
          `Placar não pode ser inferior ao ponto de parada (${floorCurrentSets.player1}x${floorCurrentSets.player2}).`,
        );
      } else {
        setFloorValidationError(null);
      }
    } else {
      setFloorValidationError(null);
    }
  }, [bothFilled, p1Val, p2Val, floorCurrentSets, completed]);

  const prevCanAddNextSetRef = useRef(false);
  const handleAddSetAuto = useCallback((): void => {
    if (!completed) return;
    const winner: Player = p1Val > p2Val ? "player1" : "player2";
    const data: SetEditData = {
      p1Games: p1Val,
      p2Games: p2Val,
      isPartial: false,
    };
    if (hasTiebreak && hasValidTiebreak) {
      data.tiebreakScore = { player1: tiebreakP1Num, player2: tiebreakP2Num };
    } else if (hasTiebreak) {
      return;
    }
    const newList = [...newSets, data];
    setNewSets(newList);
    setP1Input("");
    setP2Input("");
    setTiebreakP1("");
    setTiebreakP2("");
    const next = getNextServerAfterSet({
      currentServer,
      p1Games: p1Val,
      p2Games: p2Val,
      format: matchFormat,
      tiebreakPoints: data.tiebreakScore ?? null,
    });
    setNextServer(next);
  }, [
    completed,
    p1Val,
    p2Val,
    hasTiebreak,
    hasValidTiebreak,
    tiebreakP1Num,
    tiebreakP2Num,
    newSets,
    currentServer,
    matchFormat,
  ]);

  useEffect(() => {
    if (!isOpen) {
      prevCanAddNextSetRef.current = false;
      return;
    }
    if (
      canAddNextSet &&
      !prevCanAddNextSetRef.current &&
      initializedRef.current
    ) {
      handleAddSetAuto();
    }
    prevCanAddNextSetRef.current = canAddNextSet;
  }, [isOpen, canAddNextSet, handleAddSetAuto]);

  if (!isOpen) return null;

  const partial = bothFilled && !completed;
  const canConfirm =
    !floorValidationError &&
    !matchWouldEnd &&
    (newSets.length > 0 ||
      (bothFilled && (!hasTiebreak || tiebreakComplete)) ||
      completedSets.length > 0);

  const handleGameInputChange = (
    value: string,
    setter: (v: string) => void,
  ): void => {
    setConfirmError(null);
    setFloorValidationError(null);
    if (value === "") {
      setter("");
      setTiebreakP1("");
      setTiebreakP2("");
      return;
    }
    if (!/^\d+$/.test(value)) return;
    const num = parseInt(value, 10);
    if (floorCurrentSets) {
      const minVal =
        setter === setP1Input
          ? floorCurrentSets.player1
          : floorCurrentSets.player2;
      if (num < minVal && !completed) {
        setFloorValidationError(
          `Placar não pode ser inferior a ${minVal} (ponto de parada).`,
        );
      } else {
        setFloorValidationError(null);
      }
    }
    setter(num > 50 ? "50" : value.replace(/^0+(?=[1-9]|$)/, ""));
    setTiebreakP1("");
    setTiebreakP2("");
    setP1Points("0");
    setP2Points("0");
  };

  const handlePointsSelectChange = (
    value: string,
    setter: (v: string) => void,
  ): void => {
    setter(value);
    setConfirmError(null);
  };

  const handleConfirm = (): void => {
    setConfirmError(null);
    if (floorValidationError) return;
    if (setValidationError && !partial) return;
    if (setValidation?.tiebreakRequired) return;

    if (bothFilled && hasTiebreak && completed && tiebreakComplete) {
      const setWinner = p1Val > p2Val ? "player1" : "player2";
      const tiebreakWinner =
        tiebreakP1Num > tiebreakP2Num ? "player1" : "player2";
      if (setWinner !== tiebreakWinner) {
        setConfirmError(
          "Vencedor do tiebreak não corresponde ao vencedor do set.",
        );
        return;
      }
    }

    if (matchWouldEnd && !completed) {
      // Remove the error and allow confirmation for the final set
    } else if (matchWouldEnd && completed) {
      // If it's the final set and it's marked as completed, it's valid
    } else if (matchWouldEnd && !completed) {
       // This block is intentionally left for cases where a partial set would end the match
       // but for now, we allow the user to confirm a match-ending score.
    }


    if (bothFilled && floorCurrentSets && !completed) {
      if (
        p1Val < floorCurrentSets.player1 ||
        p2Val < floorCurrentSets.player2
      ) {
        setConfirmError(
          `Placar não pode ser inferior ao ponto de parada (${floorCurrentSets.player1}x${floorCurrentSets.player2}).`,
        );
        return;
      }
    }

    if (completed && !matchWouldEnd && !canAddNextSet && maxSets > 1) {
      return;
    }

    if (!completed && initialGameRef.current) {
      const sameSetScore =
        p1Val === currentSets.player1 && p2Val === currentSets.player2;

      if (sameSetScore) {
        const parsePointVal = (v: string): number | string => {
          if (v === "DEUCE" || v === "AD") return v;
          return parseInt(v || "0", 10);
        };
        const toProgress = (v: number | string): number => {
          if (v === "AD") return 4;
          if (v === "DEUCE") return 3;
          const n = typeof v === "number" ? v : parseInt(String(v), 10);
          if (n === 40) return 3;
          if (n === 30) return 2;
          if (n === 15) return 1;
          return 0;
        };
        const initial = initialGameRef.current;
        const oldP1 = toProgress(parsePointVal(initial.player1));
        const oldP2 = toProgress(parsePointVal(initial.player2));
        const newP1 = toProgress(parsePointVal(p1Points));
        const newP2 = toProgress(parsePointVal(p2Points));

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
    const finalSets = [...existingCompleted, ...newSets];
    if (bothFilled) {
      const setData: SetEditData = {
        p1Games: p1Val,
        p2Games: p2Val,
        isPartial: !completed,
      };
      if (hasTiebreak && completed && tiebreakComplete) {
        setData.tiebreakScore = {
          player1: tiebreakP1Num,
          player2: tiebreakP2Num,
        };
      } else if (!completed) {
        const parsePointVal = (v: string): number | string => {
          if (v === "DEUCE" || v === "AD") return v;
          return parseInt(v || "0", 10);
        };
        const gamesChanged =
          p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
        setData.currentGamePoints = {
          player1: gamesChanged ? 0 : parsePointVal(p1Points),
          player2: gamesChanged ? 0 : parsePointVal(p2Points),
        };
      }
      finalSets.push(setData);
    }
    onConfirm(finalSets, nextServer);
  };

  const totalP1SetsWon = p1SetsWon;
  const totalP2SetsWon = p2SetsWon;

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
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Sets Finalizados
              </p>
              {completedSets.map((set, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm text-gray-200"
                >
                  <span className="text-gray-500 w-14">Set {idx + 1}</span>
                  <span className="font-mono font-semibold">
                    {set.games.player1}x{set.games.player2}
                  </span>
                  <span
                    className={`text-xs font-semibold ${set.winner === "player1" ? "text-blue-400" : "text-emerald-400"}`}
                  >
                    {set.winner === "player1" ? playerNames.p1 : playerNames.p2}
                  </span>
                </div>
              ))}
            </div>
          )}

          {newSets.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Sets Adicionados
              </p>
              {newSets.map((set, idx) => {
                const setIdx = completedSets.length + idx;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-sm text-gray-200"
                  >
                    <span className="text-gray-500 w-14">Set {setIdx + 1}</span>
                    <span className="font-mono font-semibold">
                      {set.p1Games}x{set.p2Games}
                    </span>
                    <span
                      className={`text-xs font-semibold ${set.p1Games > set.p2Games ? "text-blue-400" : "text-emerald-400"}`}
                    >
                      {set.p1Games > set.p2Games
                        ? playerNames.p1
                        : playerNames.p2}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {matchAlreadyOver && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-300">
              O placar atual já encerrou a partida — não é possível adicionar
              mais sets.
            </div>
          )}

          {totalEditedSets < maxSets && !matchAlreadyOver && (
            <div className="space-y-3 rounded-lg bg-gray-750 border border-white/5 p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Set {totalEditedSets + 1}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16 truncate">
                  {playerNames.p1}
                </span>
                <input
                  type="number"
                  className={`w-16 text-center bg-gray-700 border rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    bothFilled && p1Val > p2Val
                      ? "border-green-500/50"
                      : "border-white/10"
                  }`}
                  value={p1Input}
                  onChange={(e) =>
                    handleGameInputChange(e.target.value, setP1Input)
                  }
                  placeholder="0"
                  autoFocus
                  min={floorCurrentSets?.player1 ?? 0}
                  max={50}
                />
                <span className="text-gray-500 text-xs">×</span>
                <input
                  type="number"
                  className={`w-16 text-center bg-gray-700 border rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    bothFilled && p2Val > p1Val
                      ? "border-green-500/50"
                      : "border-white/10"
                  }`}
                  value={p2Input}
                  onChange={(e) =>
                    handleGameInputChange(e.target.value, setP2Input)
                  }
                  placeholder="0"
                  min={floorCurrentSets?.player2 ?? 0}
                  max={50}
                />
                <span className="text-xs text-gray-400 w-16 truncate text-right">
                  {playerNames.p2}
                </span>
              </div>

              {bothFilled &&
                setValidationError &&
                !(setValidation?.isPartial === true) && (
                  <p className="text-xs text-red-400">{setValidationError}</p>
                )}

              {floorValidationError && (
                <p className="text-xs text-red-400">{floorValidationError}</p>
              )}

              {hasTiebreak && bothFilled && completed && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-semibold text-gray-400">
                    Tie-Break
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 truncate">
                      {playerNames.p1}
                    </span>
                    <input
                      type="number"
                      className="w-16 text-center bg-gray-700 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={tiebreakP1}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 0) setTiebreakP1(String(v));
                        else if (e.target.value === "") setTiebreakP1("");
                      }}
                      min={0}
                      max={20}
                      placeholder="0"
                    />
                    <span className="text-gray-500 text-xs">×</span>
                    <input
                      type="number"
                      className="w-16 text-center bg-gray-700 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={tiebreakP2}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 0) setTiebreakP2(String(v));
                        else if (e.target.value === "") setTiebreakP2("");
                      }}
                      min={0}
                      max={20}
                      placeholder="0"
                    />
                    <span className="text-xs text-gray-400 w-16 truncate text-right">
                      {playerNames.p2}
                    </span>
                  </div>
                  {hasTiebreak &&
                    bothFilled &&
                    completed &&
                    !tiebreakComplete && (
                      <p className="text-xs text-gray-500 mt-1">
                        Informe o placar do tiebreak (ex.: 7x5).
                      </p>
                    )}
                </div>
              )}

              {bothFilled && (
                <p
                  className={`text-xs ${completed ? "text-green-400" : "text-amber-400"}`}
                >
                  {completed ? (
                    matchWouldEnd ? (
                      <>
                        {p1Val > p2Val ? playerNames.p1 : playerNames.p2} venceu
                        o set — partida encerrada
                      </>
                    ) : canAddNextSet ? (
                      <>
                        {p1Val > p2Val ? playerNames.p1 : playerNames.p2} venceu
                        o set — avançando para Set {totalEditedSets + 2}
                      </>
                    ) : (
                      <>
                        {p1Val > p2Val ? playerNames.p1 : playerNames.p2} venceu
                        o set
                      </>
                    )
                  ) : (
                    <>Set em andamento — informe os pontos do game abaixo</>
                  )}
                </p>
              )}

              {partial && floorCurrentSets && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-2">
                  <p className="text-xs text-amber-300">
                    Ponto de parada: {floorCurrentSets.player1}x
                    {floorCurrentSets.player2} — placar não pode ser inferior a
                    este valor.
                  </p>
                </div>
              )}

              {partial && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-semibold text-gray-400">
                    Pontos no Game Atual
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 truncate">
                      {playerNames.p1}
                    </span>
                    <select
                      className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={p1Points}
                      onChange={(e) =>
                        handlePointsSelectChange(e.target.value, setP1Points)
                      }
                    >
                      {GAME_POINTS.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                      {p2Points === "40" && (
                        <>
                          <option value="DEUCE">Deuce</option>
                          <option value="AD">Adv.</option>
                        </>
                      )}
                    </select>
                    <span className="text-gray-500 text-xs">×</span>
                    <select
                      className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={p2Points}
                      onChange={(e) =>
                        handlePointsSelectChange(e.target.value, setP2Points)
                      }
                    >
                      {GAME_POINTS.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                      {p1Points === "40" && (
                        <>
                          <option value="DEUCE">Deuce</option>
                          <option value="AD">Adv.</option>
                        </>
                      )}
                    </select>
                    <span className="text-xs text-gray-400 w-16 truncate text-right">
                      {playerNames.p2}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {(totalP1SetsWon > 0 || totalP2SetsWon > 0) && (
            <div className="flex items-center justify-center gap-4 text-sm font-semibold text-gray-200 pt-1">
              <span>{playerNames.p1}</span>
              <span className="text-lg font-mono">
                {totalP1SetsWon} — {totalP2SetsWon}
              </span>
              <span>{playerNames.p2}</span>
            </div>
          )}
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
              disabled={!canConfirm}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all"
            >
              Confirmar Placar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
