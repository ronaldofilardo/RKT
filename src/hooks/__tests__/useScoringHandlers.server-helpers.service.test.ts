import { createServerHelpersService } from "@/hooks/useScoringHandlers.server-helpers.service";

describe("createServerHelpersService", () => {
  function makeCtx(server: "player1" | "player2") {
    const match = {
      id: "m1",
      format: "BEST_OF_3",
      player1: { id: "p1", name: "Player 1" },
      player2: { id: "p2", name: "Player 2" },
      initialServerId: "p1",
      scoreState: null,
      state: "IN_PROGRESS",
    } as any;
    const engineRef = {
      current: {
        getState: jest.fn().mockReturnValue({ server } as any),
      } as any,
    };
    return { match, engineRef };
  }

  describe("getServerId", () => {
    it("retorna player1.id quando state.server é player1", () => {
      const { match, engineRef } = makeCtx("player1");
      const svc = createServerHelpersService({ engineRef, match });
      expect(svc.getServerId()).toBe("p1");
    });

    it("retorna player2.id quando state.server é player2", () => {
      const { match, engineRef } = makeCtx("player2");
      const svc = createServerHelpersService({ engineRef, match });
      expect(svc.getServerId()).toBe("p2");
    });

    it("retorna initialServerId quando engineRef.current é null (fallback)", () => {
      const match = {
        player1: { id: "p1" },
        initialServerId: "p1",
      } as any;
      const svc = createServerHelpersService({
        engineRef: { current: null } as any,
        match,
      });
      expect(svc.getServerId()).toBe("p1");
    });
  });

  describe("getWinnerId — regressão do bug do opponent fixo em player1", () => {
    it("isServer=true retorna o sacador atual (player1 sacando)", () => {
      const { match, engineRef } = makeCtx("player1");
      const svc = createServerHelpersService({ engineRef, match });
      expect(svc.getWinnerId(true)).toBe("p1");
    });

    it("isServer=true retorna o sacador atual (player2 sacando)", () => {
      const { match, engineRef } = makeCtx("player2");
      const svc = createServerHelpersService({ engineRef, match });
      expect(svc.getWinnerId(true)).toBe("p2");
    });

    it("isServer=false retorna o DEVOLVEDOR quando player1 está sacando (caso quebrado antes da correção)", () => {
      const { match, engineRef } = makeCtx("player1");
      const svc = createServerHelpersService({ engineRef, match });
      expect(svc.getWinnerId(false)).toBe("p2");
    });

    it("isServer=false retorna o DEVOLVEDOR quando player2 está sacando", () => {
      const { match, engineRef } = makeCtx("player2");
      const svc = createServerHelpersService({ engineRef, match });
      expect(svc.getWinnerId(false)).toBe("p1");
    });
  });
});
