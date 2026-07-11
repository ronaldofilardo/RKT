"use client";

import { useMemo, useCallback } from "react";

interface MatchCardProps {
  match: {
    id: string;
    state: string;
    format: string;
    player1: { name: string };
    player2: { name: string };
    scheduledAt?: string | null;
    scoreState?: any;
    suspendedSessionId?: string;
    matchStateSnapshot?: string | null;
  };
  onClick?: (match: any) => void;
  onReport?: (match: any) => void;
  onFinish?: (match: any) => void;
  onDelete?: (match: any) => void;
}

function normalizeScoreState(rawScoreState: any) {
  if (!rawScoreState) return null;

  let parsed = rawScoreState;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (parsed?.sets && parsed?.currentGame) {
    return parsed;
  }

  if (parsed?.sets && Array.isArray(parsed.sets)) {
    return {
      ...parsed,
      currentGame: parsed.currentGame ?? {
        player1: 0,
        player2: 0,
        isDeuce: false,
        advantage: null,
      },
    };
  }

  if (parsed?.state && Array.isArray(parsed?.history)) {
    return parsed.state;
  }

  return null;
}

export function MatchCard({ match, onClick, onReport, onFinish, onDelete }: MatchCardProps) {
  const isSuspendedAnnotation = Boolean(match.suspendedSessionId);

  const formatLabel: Record<string, string> = {
    BEST_OF_3: "Melhor de 3 Sets",
    BEST_OF_3_MATCH_TB: "Melhor de 3 - TB 3º",
    BEST_OF_3_NO_AD: "Melhor de 3 - No-Ad",
    BEST_OF_5: "Melhor de 5 Sets",
    SHORT_SET_2V2_NO_AD: "Sets Curtos 2/2",
    MATCH_TB_10: "Match Tie-break",
    PRO_SET_8: "Set Profissional 8",
  };

  const statusLabel: Record<string, string> = {
    SCHEDULED: "Agendada",
    IN_PROGRESS: "Em Andamento",
    FINISHED: "Finalizada",
    CANCELLED: "Cancelada",
  };

  const formatScoreSet = (set: any) => {
    if (set.isTiebreak && set.tiebreakScore) {
      const loser = Math.min(
        set.tiebreakScore.player1,
        set.tiebreakScore.player2,
      );
      return `${set.player1}/${set.player2}(${loser})`;
    }
    return `${set.player1}/${set.player2}`;
  };

  const scoreState = useMemo(() => {
    const normalizedFromScoreState = normalizeScoreState(match.scoreState);
    if (normalizedFromScoreState) return normalizedFromScoreState;
    return normalizeScoreState(match.matchStateSnapshot);
  }, [match.scoreState, match.matchStateSnapshot]);

  const lastRegisteredScore = useMemo(() => {
    if (scoreState?.sets?.length) {
      return scoreState.sets.map(formatScoreSet).join("  ·  ");
    }
    // Se não há sets completos, mostrar os pontos do currentGame
    if (scoreState?.currentGame) {
      const GAME_POINTS = ["0", "15", "30", "40"] as const;
      const pts1 = scoreState.currentGame.player1 ?? 0;
      const pts2 = scoreState.currentGame.player2 ?? 0;
      const p1 = scoreState.currentGame.advantage === "player1"
        ? "AD"
        : (GAME_POINTS[Math.min(pts1, 3)] ?? String(pts1));
      const p2 = scoreState.currentGame.advantage === "player2"
        ? "AD"
        : (GAME_POINTS[Math.min(pts2, 3)] ?? String(pts2));
      return `${p1}-${p2}`;
    }
    return null;
  }, [scoreState]);

  const suspendedAnnotationScore = useMemo(() => {
    if (!match.matchStateSnapshot) return null;
    try {
      const raw = JSON.parse(match.matchStateSnapshot);
      const snap = raw?.state && Array.isArray(raw?.history) ? raw.state : raw;
      return snap;
    } catch {
      return null;
    }
  }, [match.matchStateSnapshot]);
  

  const handleClick = useCallback(() => {
    if (onClick) onClick(match);
  }, [onClick, match]);

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 transition-shadow ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${isSuspendedAnnotation ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}
        >
          {isSuspendedAnnotation
            ? "Suspensa"
            : statusLabel[match.state] || match.state}
        </span>
        <div className="flex items-center gap-2">
          {onReport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReport(match);
              }}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
              title="Ver relatório"
            >
              📊
            </button>
          )}
          {match.state === 'IN_PROGRESS' && onFinish && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFinish(match);
              }}
              className="text-xs text-green-600 hover:text-green-700 transition-colors"
              title="Encerrar partida"
            >
              ✓
            </button>
          )}
          {(match.state === 'SCHEDULED' || match.state === 'IN_PROGRESS') && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(match);
              }}
              className="text-xs text-red-600 hover:text-red-700 transition-colors"
              title="Excluir partida"
            >
              🗑
            </button>
          )}
          <span className="text-xs text-gray-500">{formatLabel[match.format] || match.format}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-x-4">
        {(lastRegisteredScore || suspendedAnnotationScore) ? (
          <>
            <div className="grid grid-rows-[1.5rem_2rem_2rem] text-sm">
              <div className="text-[10px] text-gray-500 font-mono"></div>
              <p className="font-semibold text-gray-900 truncate self-center">
                {match.player1.name}
              </p>
              <p className="font-semibold text-gray-900 truncate self-center">
                {match.player2.name}
              </p>
            </div>
            <div className="text-right text-sm font-mono">
              {scoreState?.sets && scoreState.sets.length > 0 ? (
                <>
                  {/* Header: Set 1, Set 2, Set 3..., Pontos */}
                  <div className="grid gap-x-1 text-[10px] text-gray-500" style={{
                    gridTemplateColumns: `repeat(${scoreState.sets.length}, 1.5rem) 2.5rem`
                  }}>
                    {scoreState.sets.map((_: any, idx: number) => (
                      <span key={idx}>{idx + 1}</span>
                    ))}
                    <span>Pontos</span>
                  </div>
                  {/* Player 1 */}
                  <div className={["grid gap-x-1 h-8 items-center", isSuspendedAnnotation ? "text-amber-700" : "text-gray-900"].join(" ")} style={{
                    gridTemplateColumns: `repeat(${scoreState.sets.length}, 1.5rem) 2.5rem`
                  }}>
                    {scoreState.sets.map((s: any, idx: number) => (
                      <span key={idx}>{s.player1 ?? 0}</span>
                    ))}
                    <span>
                      {(() => {
                        const pts = scoreState?.currentGame?.player1 ?? 0;
                        if (scoreState?.currentGame?.advantage === "player1") return "AD";
                        const GP = ["0", "15", "30", "40"];
                        return GP[Math.min(pts, 3)];
                      })()}
                    </span>
                  </div>
                  {/* Player 2 */}
                  <div className={["grid gap-x-1 h-8 items-center", isSuspendedAnnotation ? "text-amber-700" : "text-gray-900"].join(" ")} style={{
                    gridTemplateColumns: `repeat(${scoreState.sets.length}, 1.5rem) 2.5rem`
                  }}>
                    {scoreState.sets.map((s: any, idx: number) => (
                      <span key={idx}>{s.player2 ?? 0}</span>
                    ))}
                    <span>
                      {(() => {
                        const pts = scoreState?.currentGame?.player2 ?? 0;
                        if (scoreState?.currentGame?.advantage === "player2") return "AD";
                        const GP = ["0", "15", "30", "40"];
                        return GP[Math.min(pts, 3)];
                      })()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-[1.5rem_2.5rem] gap-x-1 text-[10px] text-gray-500">
                    <span></span>
                    <span>Pontos</span>
                  </div>
                  <div className={["grid grid-cols-[1.5rem_2.5rem] gap-x-1 h-8 items-center", isSuspendedAnnotation ? "text-amber-700" : "text-gray-900"].join(" ")}>
                    <span className="text-[10px] text-gray-400">p1</span>
                    <span>
                      {(() => {
                        const pts = scoreState?.currentGame?.player1 ?? 0;
                        if (scoreState?.currentGame?.advantage === "player1") return "AD";
                        const GP = ["0", "15", "30", "40"];
                        return GP[Math.min(pts, 3)];
                      })()}
                    </span>
                  </div>
                  <div className={["grid grid-cols-[1.5rem_2.5rem] gap-x-1 h-8 items-center", isSuspendedAnnotation ? "text-amber-700" : "text-gray-900"].join(" ")}>
                    <span className="text-[10px] text-gray-400">p2</span>
                    <span>
                      {(() => {
                        const pts = scoreState?.currentGame?.player2 ?? 0;
                        if (scoreState?.currentGame?.advantage === "player2") return "AD";
                        const GP = ["0", "15", "30", "40"];
                        return GP[Math.min(pts, 3)];
                      })()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm">
            <p className="font-semibold text-gray-900 truncate">{match.player1.name}</p>
            <p className="font-semibold text-gray-900 truncate">{match.player2.name}</p>
          </div>
        )}
      </div>

      

      {match.scheduledAt && (
        <p className="mt-3 text-xs text-gray-500">
          {new Date(match.scheduledAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
