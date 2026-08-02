import { createModalHandlersService } from "@/hooks/useScoringHandlers.modals.service";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";

const baseServeErrorState: ScoreboardUIState = {
  serveStep: "none",
  firstServeError: null,
  pendingServeError: null,
  pendingDoubleFault: false,
  serveErrorStage: null,
  isServeErrorModalOpen: false,
};

function makeService(serveErrorState: Partial<ScoreboardUIState> = {}) {
  return createModalHandlersService({
    serveErrorState: { ...baseServeErrorState, ...serveErrorState },
    open: jest.fn(),
  });
}

describe("createModalHandlersService", () => {
  describe("createAceRallyDetails — mapDirection sem tradução", () => {
    it("preserva 'aberto' literalmente (regressão do bug aberto->paralela)", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails("flat", "aberto");
      expect(rd.direcao).toBe("aberto");
    });

    it("preserva 'fechado' literalmente (regressão do bug fechado->cruzada)", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails("flat", "fechado");
      expect(rd.direcao).toBe("fechado");
    });

    it("preserva 'centro' literalmente", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails("flat", "centro");
      expect(rd.direcao).toBe("centro");
    });

    it("preserva 'paralela' quando vinda da taxonomia de rally", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails("flat", "paralela");
      expect(rd.direcao).toBe("paralela");
    });

    it("preserva 'cruzada' quando vinda da taxonomia de rally", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails("flat", "cruzada");
      expect(rd.direcao).toBe("cruzada");
    });

    it("quando direction é undefined, direcao fica undefined", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails("flat", undefined);
      expect(rd.direcao).toBeUndefined();
    });

    it("quando effect é undefined, efeito fica undefined", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails(undefined, "aberto");
      expect(rd.efeito).toBeUndefined();
    });

    it("quando ambos undefined, não há placeholder em efeito/direcao", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails(undefined, undefined);
      expect(rd.efeito).toBeUndefined();
      expect(rd.direcao).toBeUndefined();
    });

    it("campos estruturais do ACE ficam corretos", () => {
      const svc = makeService();
      const rd = svc.createAceRallyDetails("flat", "aberto");
      expect(rd).toMatchObject({
        vencedor: "sacador",
        situacao: "saque",
        tipo: "winner",
        golpe: "saque",
        previewBalls: 1,
      });
    });
  });

  describe("createDoubleFaultRallyDetails — tipo dupla_falta + subtipo2 da 2ª falta", () => {
    it("usa tipo 'dupla_falta' (regressão do bug tipo=erro_nao_forcado)", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("net");
      expect(rd.tipo).toBe("dupla_falta");
    });

    it("não usa mais 'erro_nao_forcado' para DF", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("out");
      expect(rd.tipo).not.toBe("erro_nao_forcado");
    });

    it("subtipo2='net' quando segunda falta foi net", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("net");
      expect(rd.subtipo2).toBe("net");
    });

    it("subtipo2='out' quando segunda falta foi out", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("out");
      expect(rd.subtipo2).toBe("out");
    });

    it("preserva direção literal da 2ª falta (aberto)", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("net", "flat", "aberto");
      expect(rd.direcao).toBe("aberto");
    });

    it("preserva direção literal da 2ª falta (fechado)", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("out", "slice", "fechado");
      expect(rd.direcao).toBe("fechado");
    });

    it("efeito/direcao undefined quando usuário não marcou nada na 2ª falta", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("net", undefined, undefined);
      expect(rd.efeito).toBeUndefined();
      expect(rd.direcao).toBeUndefined();
    });

    it("campos estruturais do DF ficam corretos", () => {
      const svc = makeService();
      const rd = svc.createDoubleFaultRallyDetails("net");
      expect(rd).toMatchObject({
        vencedor: "devolvedor",
        situacao: "saque",
        golpe: "saque",
        previewBalls: 1,
      });
    });
  });

  describe("openAceModal — step derivado de firstServeError", () => {
    it("abre em 'first' quando firstServeError é null", () => {
      const open = jest.fn();
      const svc = createModalHandlersService({
        serveErrorState: { ...baseServeErrorState, firstServeError: null },
        open,
      });
      svc.openAceModal();
      expect(open).toHaveBeenCalledWith("serve-effect", {
        context: "winner",
        serveStep: "first",
      });
    });

    it("abre em 'second' quando firstServeError está preenchido", () => {
      const open = jest.fn();
      const svc = createModalHandlersService({
        serveErrorState: {
          ...baseServeErrorState,
          firstServeError: { errorType: "out" },
        },
        open,
      });
      svc.openAceModal();
      expect(open).toHaveBeenCalledWith("serve-effect", {
        context: "winner",
        serveStep: "second",
      });
    });
  });
});
