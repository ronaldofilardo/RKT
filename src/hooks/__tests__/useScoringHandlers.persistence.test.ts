import { persistStateWithRetry } from "@/hooks/useScoringHandlers.persistence";
import type { ScoringState } from "@/core/scoring/types";

const baseState: ScoringState = {
  sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
  currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
  server: "player1",
  isFinished: false,
  winner: null,
  setsWon: { player1: 0, player2: 0 },
  startedAt: null,
  secondServe: false,
};

describe("persistStateWithRetry", () => {
  const fetchMatch = jest.fn().mockResolvedValue(undefined);
  const setError = jest.fn();
  const match = { version: 33 };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("deve retornar success=true no caminho feliz", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ version: 34 }),
    });

    const result = await persistStateWithRetry(baseState, "undo", {
      matchId: "m1",
      match,
      tokenRef: { current: "tok" },
      setError,
      fetchMatch,
    });

    expect(result).toEqual({ success: true, version: 34 });
    expect(fetchMatch).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  it("deve re-sincronizar via fetchMatch e retornar needsResync=true em 409", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: async () => ({
        error: "VERSION_CONFLICT",
        currentVersion: 34,
        expectedVersion: 33,
      }),
    });

    const result = await persistStateWithRetry(baseState, "undo", {
      matchId: "m1",
      match,
      tokenRef: { current: "tok" },
      setError,
      fetchMatch,
    });

    expect(result.success).toBe(false);
    expect(result.needsResync).toBe(true);
    expect(result.conflict).toBe(true);
    // Não deve re-PATCH em loop; deve re-sincronizar do servidor UMA vez
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(fetchMatch).toHaveBeenCalledTimes(1);
    expect(fetchMatch).toHaveBeenCalledWith(true);
    expect(setError).toHaveBeenCalledWith(
      expect.stringContaining("Sincronizado"),
    );
  });

  it("deve retornar needsResync sem retry se 409 vier sem fetchMatch disponível", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: async () => ({ error: "VERSION_CONFLICT", currentVersion: 34 }),
    });

    const result = await persistStateWithRetry(baseState, "undo", {
      matchId: "m1",
      match,
      tokenRef: { current: "tok" },
      setError,
    });

    expect(result.success).toBe(false);
    expect(result.needsResync).toBe(true);
    expect(result.conflict).toBe(true);
    expect(setError).toHaveBeenCalledWith(
      "Conflito de versão: re-sincronize o placar manualmente",
    );
  });

  it("deve permitir override do allowScoreEdit via options", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({}),
    });

    await persistStateWithRetry(baseState, "editor-flow", {
      matchId: "m1",
      match,
      tokenRef: { current: "tok" },
      setError,
      fetchMatch,
      allowScoreEdit: true,
    });

    const payload = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(payload.allowScoreEdit).toBe(true);
  });

  describe("integração com constants", () => {
    it("deve usar TIMEOUTS_MS.PERSIST_BASE_DELAY via calculateBackoffDelay", async () => {
      const callTimes: number[] = [];
      const realSetTimeout = global.setTimeout;
      jest.spyOn(global, "setTimeout").mockImplementation(((cb: () => void, ms: number) => {
        callTimes.push(ms);
        return realSetTimeout(cb, 0);
      }) as any);

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("network error"))
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({ version: 34 }),
        });

      await persistStateWithRetry(baseState, "test", {
        matchId: "m1",
        match,
        tokenRef: { current: "tok" },
        setError,
        fetchMatch,
      });

      expect(callTimes.length).toBeGreaterThan(0);
      expect(callTimes[0]).toBe(1_000);

      jest.restoreAllMocks();
    });
  });
});
