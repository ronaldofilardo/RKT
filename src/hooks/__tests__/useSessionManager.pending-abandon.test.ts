/**
 * @jest-environment jsdom
 */
/**
 * Testes do novo módulo criado em 2026-09-08 para resolver o bug de
 * abandonCurrentSession falhando silenciosamente (sem retry) quando o POST
 * .../abandon não completa (ex.: rede instável durante o "Sincronizando
 * pontos pendentes...").
 */
import {
  enqueuePendingAbandon,
  flushPendingAbandons,
  type PendingAbandon,
} from "@/hooks/useSessionManager.pending-abandon";

function makeEntry(overrides: Partial<PendingAbandon> = {}): PendingAbandon {
  return {
    matchId: "match-1",
    sessionId: "session-1",
    matchStateSnapshot: JSON.stringify({ sets: [] }),
    token: "tok-123",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("useSessionManager.pending-abandon", () => {
  beforeEach(() => {
    localStorage.clear();
    (global.fetch as any) = jest.fn();
  });

  it("enqueuePendingAbandon persiste a entrada no localStorage", () => {
    enqueuePendingAbandon(makeEntry());
    const raw = localStorage.getItem("pending_abandons");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].matchId).toBe("match-1");
    expect(parsed[0].sessionId).toBe("session-1");
  });

  it("enqueuePendingAbandon substitui uma entrada existente para o mesmo match/sessão (não duplica)", () => {
    enqueuePendingAbandon(makeEntry({ matchStateSnapshot: "v1" }));
    enqueuePendingAbandon(makeEntry({ matchStateSnapshot: "v2" }));
    const parsed = JSON.parse(localStorage.getItem("pending_abandons") as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].matchStateSnapshot).toBe("v2");
  });

  it("flushPendingAbandons não faz nada quando a fila está vazia", async () => {
    await flushPendingAbandons();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("flushPendingAbandons reenvia e limpa a fila quando o POST tem sucesso", async () => {
    enqueuePendingAbandon(makeEntry());
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await flushPendingAbandons();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/matches/match-1/sessions/session-1/abandon",
      expect.objectContaining({ method: "POST" })
    );
    expect(localStorage.getItem("pending_abandons")).toBeNull();
  });

  it("flushPendingAbandons MANTÉM a entrada na fila se o POST continuar falhando (ainda offline)", async () => {
    enqueuePendingAbandon(makeEntry());
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network error"));

    await flushPendingAbandons();

    const parsed = JSON.parse(localStorage.getItem("pending_abandons") as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].sessionId).toBe("session-1");
  });

  it("flushPendingAbandons MANTÉM a entrada quando o servidor responde com erro (ok=false)", async () => {
    enqueuePendingAbandon(makeEntry());
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    await flushPendingAbandons();

    const parsed = JSON.parse(localStorage.getItem("pending_abandons") as string);
    expect(parsed).toHaveLength(1);
  });

  it("flushPendingAbandons processa múltiplas entradas independentemente (uma falha não bloqueia a outra)", async () => {
    enqueuePendingAbandon(makeEntry({ matchId: "match-1", sessionId: "s1" }));
    enqueuePendingAbandon(makeEntry({ matchId: "match-2", sessionId: "s2" }));

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true }) // match-1 sucesso
      .mockRejectedValueOnce(new Error("still offline")); // match-2 falha

    await flushPendingAbandons();

    const parsed = JSON.parse(localStorage.getItem("pending_abandons") as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].matchId).toBe("match-2");
  });
});
