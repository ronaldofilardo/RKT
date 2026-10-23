"use client";

import type { ScoringPlayAreaProps } from "./scoring-play-area.types";

type FinishedBannerProps = {
  winner: ScoringPlayAreaProps["winner"];
  match: ScoringPlayAreaProps["match"];
  scoreState: ScoringPlayAreaProps["scoreState"];
  onNavigateReport: () => void;
  onRegisterAndExit: () => void;
};

export function ScoringFinishedBanner({
  winner,
  match,
  scoreState,
  onNavigateReport,
  onRegisterAndExit,
}: FinishedBannerProps) {
  return (
    <div className="mt-2 sm:mt-3 bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-3 sm:p-5 text-center relative z-10 mx-0">
      <span className="text-2xl sm:text-4xl">🏆</span>
      <h2 className="text-base sm:text-xl font-black text-white mt-1 sm:mt-2">
        PARTIDA FINALIZADA!
      </h2>
      <p className="text-sm sm:text-lg font-bold text-yellow-300 mt-0.5 sm:mt-1">
        VENCEDOR:{" "}
        {winner === "player1" ? match.player1.name : match.player2.name}
      </p>
      <p className="text-[11px] sm:text-sm text-telemetry-text-muted mt-0.5 sm:mt-1">
        {scoreState?.setsWon.player1} x {scoreState?.setsWon.player2} sets
      </p>
      <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4 justify-center">
        <button
          onClick={onNavigateReport}
          className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl text-[11px] sm:text-sm min-h-[44px]"
        >
          📊 Relatório
        </button>
        <button
          onClick={onRegisterAndExit}
          className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-[11px] sm:text-sm border border-white/20 min-h-[44px]"
        >
          ✅ Registrar
        </button>
      </div>
    </div>
  );
}
