import type { MutableRefObject } from "react";
import type { RallyDetails } from "@/core/scoring/types";
import type { RallyDirecao } from "@/schemas/contracts";
import type { ScoreboardUIState } from "./useScoreboardUIState";

interface ModalHandlersOptions {
  serveErrorState: ScoreboardUIState;
  open: (modal: string, params?: Record<string, string>) => void;
}

export function createModalHandlers(options: ModalHandlersOptions) {
  const { serveErrorState, open } = options;

  const openAceModal = () => {
    const step = serveErrorState.firstServeError ? "second" : "first";
    open("serve-effect", { context: "winner", serveStep: step });
  };

  const openPointDetails = (side: "player1" | "player2") => {
    open("point-details", { winner: side });
  };

  const mapDirection = (direction?: string): RallyDirecao | undefined => {
    if (!direction) return undefined;
    const direcaoMap: Record<string, RallyDirecao> = {
      aberto: "cruzada",
      centro: "centro",
      fechado: "paralela",
    };
    return direcaoMap[direction] || undefined;
  };

  const createAceRallyDetails = (
    effect?: string,
    direction?: string
  ): RallyDetails => ({
    vencedor: "sacador",
    situacao: "devolucao",
    tipo: "winner",
    golpe: "fh",
    efeito: effect as any,
    direcao: mapDirection(direction),
    previewBalls: 1,
  });

  const createDoubleFaultRallyDetails = (
    errorType: "out" | "net",
    effect?: string,
    direction?: string
  ): RallyDetails => ({
    vencedor: "devolvedor",
    situacao: "devolucao",
    tipo: "erro_forcado",
    golpe: "fh",
    subtipo2: errorType === "net" ? "net" : "out",
    efeito: effect as any,
    direcao: mapDirection(direction),
    previewBalls: 1,
  });

  return {
    openAceModal,
    openPointDetails,
    mapDirection,
    createAceRallyDetails,
    createDoubleFaultRallyDetails,
  };
}