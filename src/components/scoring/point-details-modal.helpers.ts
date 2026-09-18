import { useEffect } from "react";
import type { RallyDetails } from "@/core/scoring/types";
import type { PointDetailsForm, Vencedor } from "./point-details-logic";

export function getPointWinnerDetails(
  winnerPlayerSide: "player1" | "player2",
  currentServer: "player1" | "player2",
  player1Name: string,
  player2Name: string
) {
  const vencedor: Vencedor = winnerPlayerSide === currentServer ? "sacador" : "devolvedor";
  const winnerName = winnerPlayerSide === "player1" ? player1Name : player2Name;
  return { vencedor, winnerName };
}

function toCleanRallyOptions(form: PointDetailsForm) {
  return {
    subtipo1: form.subtipo1 ?? undefined,
    subtipo2: form.subtipo2 ?? undefined,
    duracao: form.duracao ?? undefined,
    efeito: form.efeito ?? undefined,
    direcao: form.direcao ?? undefined,
    golpe_esp: form.golpeEsp ?? undefined,
  };
}

export function buildRallyDetails(
  form: PointDetailsForm,
  vencedor: Vencedor,
  noteText: string
): RallyDetails | null {
  if (!form.situacao || !form.tipo || !form.golpe) {
    return null;
  }
  const isDevolucao = form.situacao === "devolucao";
  const trimmed = noteText.trim();
  const textNote = trimmed || undefined;
  const options = toCleanRallyOptions(form);

  return {
    vencedor,
    situacao: form.situacao,
    tipo: form.tipo,
    golpe: form.golpe,
    ...options,
    previewBalls: isDevolucao ? 2 : 1,
    note: textNote,
  };
}

export function usePointDetailsKeyboard(
  mounted: boolean,
  onEscape: () => void
) {
  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mounted, onEscape]);
}
