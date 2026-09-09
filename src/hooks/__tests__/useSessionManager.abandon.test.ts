/**
 * @jest-environment jsdom
 */
/**
 * Testes isolados de abandonCurrentSession (2026-09-09).
 *
 * A função foi extraída de useSessionManager.ts para useSessionManager.abandon.ts
 * a fim de permitir testes unitários sem depender do hook React.
 *
 * Cobertura:
 *  - Guard: sessão/partida ausente → false
 *  - Guard: engine nulo → false
 *  - Partida finalizada: PATCH /state + PATCH /session → true
 *  - Partida finalizada: 409 conflito → false
 *  - Partida finalizada: PATCH /state falha → false
 *  - Partida finalizada: PATCH /session falha → true (melhor esforço)
 *  - Partida em andamento: POST /abandon sucesso → true
 *  - Partida em andamento: POST /abandon falha → enfileira + toast → false
 *  - Snapshot customizado é usado ao invés de engine.serialize()
 *  - Exceção inesperada → false
 */
import { abandonCurrentSession, type AbandonContext, type AbandonDeps } from "@/hooks/useSessionManager.abandon";
import type { ScoringState } from "@/core/scoring/types";
import type { PendingAbandon } from "@/hooks/useSessionManager.pending-abandon";

function makeState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [],
    currentGame: { player1: 0, player2: 0 },
    server: "player1",
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: Date.now(),
    secondServe: false,
    ...overrides,
  };
}

function makeCtx(overrides: Partial<AbandonContext> = {}): AbandonContext {
  const state = makeState();
  return {
    sessionId: "sess-1",
    matchId: "match-1",
    engine: {
      getState: jest.fn().mockReturnValue(state),
      serialize: jest.fn().mockReturnValue(JSON.stringify({ state, history: [] })),
    },
    token: "tok-abc",
    matchVersion: 3,
    ...overrides,
  };
}

function makeDeps(): AbandonDeps {
  return {
    enqueuePendingAbandon: jest.fn(),
    toast: jest.fn(),
  };
}

describe("abandonCurrentSession", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });

  // ── Guards ──────────────────────────────────────────────────────

  it("retorna false quando sessionId está vazio", async () => {
    const ctx = makeCtx({ sessionId: "" });
    const result = await abandonCurrentSession(ctx, makeDeps());
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("retorna false quando matchId está vazio", async () => {
    const ctx = makeCtx({ matchId: "" });
    const result = await abandonCurrentSession(ctx, makeDeps());
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("retorna false quando engine é nulo", async () => {
    const ctx = makeCtx({ engine: null as any });
    const result = await abandonCurrentSession(ctx, makeDeps());
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ── Branch A: partida finalizada ────────────────────────────────

  describe("partida finalizada (isFinished=true)", () => {
    it("faz PATCH /state e PATCH /session, retorna true", async () => {
      const ctx = makeCtx();
      (ctx.engine.getState as jest.Mock).mockReturnValue(makeState({ isFinished: true }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })   // PATCH /state
        .mockResolvedValueOnce({ ok: true, status: 200 });  // PATCH /session

      const result = await abandonCurrentSession(ctx, makeDeps());

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // PATCH /state
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/matches/match-1/state",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            state: "FINISHED",
            scoreState: ctx.engine.getState(),
            version: 3,
          }),
        }),
      );

      // PATCH /session
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/matches/match-1/sessions/sess-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            status: "COMPLETED",
            finalState: ctx.engine.getState(),
          }),
        }),
      );
    });

    it("retorna false quando PATCH /state retorna 409 (conflito de versão)", async () => {
      const ctx = makeCtx();
      (ctx.engine.getState as jest.Mock).mockReturnValue(makeState({ isFinished: true }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 409 });

      const result = await abandonCurrentSession(ctx, makeDeps());

      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1); // PATCH /session NÃO é chamado
    });

    it("retorna false quando PATCH /state falha com erro diferente de 409", async () => {
      const ctx = makeCtx();
      (ctx.engine.getState as jest.Mock).mockReturnValue(makeState({ isFinished: true }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await abandonCurrentSession(ctx, makeDeps());

      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("retorna true mesmo quando PATCH /session falha (melhor esforço)", async () => {
      const ctx = makeCtx();
      (ctx.engine.getState as jest.Mock).mockReturnValue(makeState({ isFinished: true }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })   // PATCH /state OK
        .mockResolvedValueOnce({ ok: false, status: 500 }); // PATCH /session falha

      const result = await abandonCurrentSession(ctx, makeDeps());

      expect(result).toBe(true);
    });

    it("retorna true mesmo quando PATCH /session lança exceção", async () => {
      const ctx = makeCtx();
      (ctx.engine.getState as jest.Mock).mockReturnValue(makeState({ isFinished: true }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(new Error("network down"));

      const result = await abandonCurrentSession(ctx, makeDeps());

      expect(result).toBe(true);
    });

    it("não envia version quando matchVersion é undefined", async () => {
      const ctx = makeCtx({ matchVersion: undefined });
      (ctx.engine.getState as jest.Mock).mockReturnValue(makeState({ isFinished: true }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      await abandonCurrentSession(ctx, makeDeps());

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body).not.toHaveProperty("version");
    });
  });

  // ── Branch B: partida em andamento ──────────────────────────────

  describe("partida em andamento (isFinished=false)", () => {
    it("faz POST /abandon com keepalive, retorna true", async () => {
      const ctx = makeCtx();
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await abandonCurrentSession(ctx, makeDeps());

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/matches/match-1/sessions/sess-1/abandon",
        expect.objectContaining({
          method: "POST",
          keepalive: true,
          body: JSON.stringify({
            matchStateSnapshot: ctx.engine.serialize(),
          }),
        }),
      );
    });

    it("inclui Authorization header com o token", async () => {
      const ctx = makeCtx({ token: "tok-xyz" });
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

      await abandonCurrentSession(ctx, makeDeps());

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.Authorization).toBe("Bearer tok-xyz");
    });

    it("retorna false e enfileira quando POST /abandon falha com erro HTTP", async () => {
      const ctx = makeCtx();
      const deps = makeDeps();
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await abandonCurrentSession(ctx, deps);

      expect(result).toBe(false);
      expect(deps.enqueuePendingAbandon).toHaveBeenCalledTimes(1);
      expect(deps.toast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "info" }),
      );
    });

    it("retorna false e enfileira quando POST /abandon lança exceção de rede", async () => {
      const ctx = makeCtx();
      const deps = makeDeps();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch"));

      const result = await abandonCurrentSession(ctx, deps);

      expect(result).toBe(false);
      expect(deps.enqueuePendingAbandon).toHaveBeenCalledTimes(1);
      const entry: PendingAbandon = deps.enqueuePendingAbandon.mock.calls[0][0];
      expect(entry.matchId).toBe("match-1");
      expect(entry.sessionId).toBe("sess-1");
      expect(entry.token).toBe("tok-abc");
      expect(entry.matchStateSnapshot).toBe(ctx.engine.serialize());
      expect(typeof entry.createdAt).toBe("number");
    });

    it("retorna false quando engine.getState() lança exceção (outer catch)", async () => {
      const ctx = makeCtx();
      (ctx.engine.getState as jest.Mock).mockImplementation(() => {
        throw new Error("engine corrupted");
      });
      const deps = makeDeps();

      const result = await abandonCurrentSession(ctx, deps);

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(deps.enqueuePendingAbandon).not.toHaveBeenCalled();
    });
  });

  // ── Snapshot customizado ────────────────────────────────────────

  describe("snapshot customizado", () => {
    it("usa o snapshot fornecido ao invés de engine.serialize()", async () => {
      const ctx = makeCtx();
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

      await abandonCurrentSession(ctx, makeDeps(), '{"custom":"snapshot"}');

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.matchStateSnapshot).toBe('{"custom":"snapshot"}');
      expect(ctx.engine.serialize).not.toHaveBeenCalled();
    });

    it("usa engine.serialize() quando snapshot não é fornecido", async () => {
      const ctx = makeCtx();
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

      await abandonCurrentSession(ctx, makeDeps());

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.matchStateSnapshot).toBe(ctx.engine.serialize());
    });

    it("enfileira o snapshot customizado em caso de falha", async () => {
      const ctx = makeCtx();
      const deps = makeDeps();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));

      await abandonCurrentSession(ctx, deps, '{"offline":"data"}');

      const entry: PendingAbandon = deps.enqueuePendingAbandon.mock.calls[0][0];
      expect(entry.matchStateSnapshot).toBe('{"offline":"data"}');
    });
  });
});
