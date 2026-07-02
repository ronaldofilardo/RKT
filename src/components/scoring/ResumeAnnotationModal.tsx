"use client";

import { useMemo } from "react";
import { getMatchFormatRules, isSetCompleteForFormat } from "@/lib/matchConfig";
import type { TennisFormat } from "@/lib/matchConfig";

type SnapshotStatus = "IN_SYNC" | "SNAPSHOT_AHEAD" | "BANK_AHEAD";

interface ResumeAnnotationModalProps {
  player1Name: string;
  player2Name: string;
  format: string;
  matchStateSnapshot: string | null;
  previousPointsCount: number;
  snapshotStatus?: SnapshotStatus;
  snapshotPointCount?: number;
  bankPointCount?: number;
  onResume: () => void;
  onStartNew: () => void;
  onDiscard: () => void;
  loading?: boolean;
  error?: string | null;
}

const STATUS_LABELS: Record<SnapshotStatus, string> = {
  IN_SYNC: "Sincronizado",
  SNAPSHOT_AHEAD: "Pontos offline",
  BANK_AHEAD: "Banco à frente",
};

const STATUS_COLORS: Record<SnapshotStatus, string> = {
  IN_SYNC: "border-green-500 bg-green-500/10 text-green-300",
  SNAPSHOT_AHEAD: "border-amber-500 bg-amber-500/10 text-amber-300",
  BANK_AHEAD: "border-red-500 bg-red-500/10 text-red-300",
};

export function ResumeAnnotationModal({
  player1Name,
  player2Name,
  format,
  matchStateSnapshot,
  previousPointsCount,
  snapshotStatus = "IN_SYNC",
  snapshotPointCount = 0,
  bankPointCount = 0,
  onResume,
  onStartNew,
  onDiscard,
  loading,
  error,
}: ResumeAnnotationModalProps) {
  const completedSetsInfo = useMemo(() => {
    if (!matchStateSnapshot) return null;
    try {
      const raw = JSON.parse(matchStateSnapshot);
      const snap = raw.state && Array.isArray(raw.history) ? raw.state : raw;
      const sets = snap.sets ?? [];

      let formatRules: ReturnType<typeof getMatchFormatRules> | null = null;
      try {
        formatRules = getMatchFormatRules(format as TennisFormat);
      } catch {}

      const completed = sets.filter((s: any) =>
        formatRules
          ? isSetCompleteForFormat(
              { player1: s.player1, player2: s.player2 },
              formatRules,
            )
          : Math.max(s.player1, s.player2) >= 6 &&
            Math.abs(s.player1 - s.player2) >= 2,
      );
      return {
        completedSets: completed,
        total: completed.length,
        current: sets[sets.length - 1] ?? null,
        isFinished: snap.isFinished ?? false,
      };
    } catch {
      return null;
    }
  }, [matchStateSnapshot, format]);

  const diff = Math.abs((snapshotPointCount ?? 0) - (bankPointCount ?? 0));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        animation: "fadeIn 200ms ease-out",
      }}
    >
      <div
        className="bg-gray-800 border-2 border-blue-500 rounded-xl max-w-[420px] w-[clamp(300px,85vw,420px)] mx-4 shadow-2xl animate-[slideUp_300ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">
            {snapshotStatus === "SNAPSHOT_AHEAD"
              ? "⚠️ Pontos Offline"
              : "👉 Retomar Anotação?"}
          </h2>
          <button
            onClick={onDiscard}
            className="text-gray-400 hover:text-white text-xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-gray-200 text-sm">
            Você saiu da partida{" "}
            <span className="text-blue-400 font-semibold">
              {player1Name} vs {player2Name}
            </span>
            .
          </p>

          {/* Snapshot status badge */}
          <div
            className={`border-l-4 rounded px-3 py-2 text-sm ${STATUS_COLORS[snapshotStatus]}`}
          >
            <p className="font-semibold">{STATUS_LABELS[snapshotStatus]}</p>
            <p className="text-xs mt-0.5 opacity-80">
              Snapshot: {snapshotPointCount} ponto(s) | Banco: {bankPointCount}{" "}
              ponto(s)
            </p>
          </div>

          {completedSetsInfo && completedSetsInfo.total > 0 && (
            <p className="text-gray-300 text-sm">
              Placar:{" "}
              {completedSetsInfo.completedSets
                .map((s: any) => `${s.player1}x${s.player2}`)
                .join(", ")}{" "}
              ({format})
            </p>
          )}

          {completedSetsInfo && !completedSetsInfo.total && (
            <p className="text-gray-300 text-sm">Formato: {format}</p>
          )}

          {completedSetsInfo?.current && !completedSetsInfo.isFinished && (
            <p className="text-gray-300 text-sm">
              Set atual: {completedSetsInfo.current.player1} x{" "}
              {completedSetsInfo.current.player2}
            </p>
          )}

          {previousPointsCount > 0 && snapshotStatus !== "SNAPSHOT_AHEAD" && (
            <p className="text-blue-300 text-sm">
              Você havia marcado {previousPointsCount} ponto(s).
            </p>
          )}

          {snapshotStatus === "SNAPSHOT_AHEAD" && (
            <p className="text-amber-200 text-sm">
              Você tinha <span className="font-bold">{diff}</span> ponto(s)
              marcado(s) offline que não foram sincronizados. Deseja enviá-los
              agora?
            </p>
          )}

          {snapshotStatus === "BANK_AHEAD" && (
            <p className="text-red-200 text-sm">
              A partida avançou <span className="font-bold">{diff}</span>{" "}
              ponto(s) desde que você saiu. Seu histórico local está
              desatualizado.
            </p>
          )}

          {snapshotStatus === "IN_SYNC" && (
            <p className="text-gray-400 text-xs italic">
              Você pode retomar com o histórico de pontos para usar o undo, ou
              começar nova anotação.
            </p>
          )}

          {error && (
            <div
              className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-sm"
              role="alert"
            >
              <p className="text-red-400">⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* Footer — buttons vary by snapshotStatus */}
        <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2">
          {snapshotStatus === "SNAPSHOT_AHEAD" && (
            <>
              <button
                onClick={onResume}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-all"
              >
                {loading
                  ? "Sincronizando..."
                  : `⬆️ Sincronizar ${diff} ponto(s) e retomar`}
              </button>
              <button
                onClick={onStartNew}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 disabled:opacity-50 transition-all"
              >
                Descartar pontos offline
              </button>
            </>
          )}

          {snapshotStatus === "BANK_AHEAD" && (
            <>
              <button
                onClick={onStartNew}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all"
              >
                {loading ? "Carregando..." : "▶️ Retomar com estado atual"}
              </button>
              <button
                onClick={onDiscard}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-transparent text-red-400 border-2 border-red-400/60 hover:bg-red-500/10 transition-all"
              >
                ❌ Descartar
              </button>
            </>
          )}

          {snapshotStatus === "IN_SYNC" && (
            <>
              <button
                onClick={onResume}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all"
              >
                {loading ? "Carregando..." : "✏️ Retomar (com undo)"}
              </button>
              <button
                onClick={onStartNew}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 disabled:opacity-50 transition-all"
              >
                🆕 Começar Nova Anotação
              </button>
              <button
                onClick={onDiscard}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-transparent text-red-400 border-2 border-red-400/60 hover:bg-red-500/10 transition-all"
              >
                ❌ Descartar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
