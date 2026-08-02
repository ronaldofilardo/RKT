"use client";

import type { RallyDetails } from "@/core/scoring/types";
import type { RallyDirecao } from "@/schemas/contracts";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";

interface ModalHandlersConfig {
  serveErrorState: ScoreboardUIState;
  open: (modal: string, params?: Record<string, string>) => void;
}

function mapDirection(direction?: string): RallyDirecao | undefined {
  if (!direction) return undefined;
  return direction as RallyDirecao;
}

export function createModalHandlersService(config: ModalHandlersConfig) {
  const { serveErrorState, open } = config;

  const openAceModal = (): void => {
    const step = serveErrorState.firstServeError ? "second" : "first";
    open("serve-effect", { context: "winner", serveStep: step });
  };

  const openPointDetails = (side: "player1" | "player2"): void => {
    open("point-details", { winner: side });
  };

  /**
   * ACE: sacador vence com o saque direto.
   * situacao = "saque", golpe = "saque" — semanticamente corretos.
   * O usuario escolhe efeito e direção no ServerEffectModal.
   */
  const createAceRallyDetails = (
    effect?: string,
    direction?: string
  ): RallyDetails => ({
    vencedor: "sacador",
    situacao: "saque",
    tipo: "winner",
    golpe: "saque",
    efeito: effect as any,
    direcao: mapDirection(direction),
    previewBalls: 1,
  });

  /**
   * DOUBLE_FAULT: devolvedor vence por dupla falta do sacador.
   * situacao = "saque", golpe = "saque".
   * tipo = "dupla_falta" — distingue de erro_nao_forcado em rally.
   * subtipo2 indica se foi "net" ou "out" (da segunda falta, que encerra o ponto).
   */
  const createDoubleFaultRallyDetails = (
    errorType: "net" | "out",
    effect?: string,
    direction?: string
  ): RallyDetails => ({
    vencedor: "devolvedor",
    situacao: "saque",
    tipo: "dupla_falta",
    golpe: "saque",
    subtipo2: errorType === "net" ? "net" : "out",
    efeito: effect as any,
    direcao: mapDirection(direction),
    previewBalls: 1,
  });

  return {
    openAceModal,
    openPointDetails,
    createAceRallyDetails,
    createDoubleFaultRallyDetails,
  };
}