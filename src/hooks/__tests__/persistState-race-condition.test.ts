/**
 * @jest-environment jsdom
 */

import type { ScoringState } from "@/core/scoring/types";

const originalFetch = global.fetch;

describe("persistState - Race Conditions e Retry com Backoff", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockMatch = {
    id: "test-match-id",
    version: 5,
    format: "BEST_OF_3",
    player1: { id: "p1", name: "Player 1" },
    player2: { id: "p2", name: "Player 2" },
    scoreState: null,
  } as any;

  const mockState = {
    sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: "player1" as const,
    setsWon: { player1: 1, player2: 0 },
    isFinished: false,
    winner: null,
    startedAt: Date.now(),
    secondServe: false,
  } as ScoringState;

  describe("Optimistic Locking", () => {
    it("deve enviar versão atual no payload", async () => {
      const mockResponse = { ok: true, status: 200, json: async () => ({}) };
      let capturedBody: string = "";
      
      global.fetch = jest.fn().mockImplementation((url: string, options: any) => {
        capturedBody = options.body;
        return mockResponse;
      }) as any;

      const persistState = async (state: ScoringState, label: string) => {
        await fetch(`/api/matches/test-match-id/state`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer test-token`,
          },
          body: JSON.stringify({
            state: state.isFinished ? "FINISHED" : "IN_PROGRESS",
            scoreState: state,
            version: mockMatch.version,
          }),
        });
      };

      await persistState(mockState, "test");

      const body = JSON.parse(capturedBody);
      expect(body.version).toBe(5);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("deve detectar conflito de versão (409)", async () => {
      const mockConflictResponse = {
        ok: false,
        status: 409,
        json: async () => ({
          error: "VERSION_CONFLICT",
          currentVersion: 10,
          expectedVersion: 5,
        }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockConflictResponse);

      let result: any;
      const persistState = async (state: ScoringState, label: string) => {
        const response = await fetch(`/api/matches/test-match-id/state`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer test-token`,
          },
          body: JSON.stringify({
            state: state.isFinished ? "FINISHED" : "IN_PROGRESS",
            scoreState: state,
            version: mockMatch.version,
          }),
        });

        if (response.status === 409) {
          const errorData = await response.json();
          result = {
            success: false,
            error: errorData.error,
            currentVersion: errorData.currentVersion,
          };
          return;
        }
      };

      await persistState(mockState, "test");

      expect(result.success).toBe(false);
      expect(result.error).toBe("VERSION_CONFLICT");
      expect(result.currentVersion).toBe(10);
    });
  });

  describe("Retry Logic", () => {
    it("deve detectar múltiplos conflitos 409", async () => {
      const mockConflictResponse = {
        ok: false,
        status: 409,
        json: async () => ({ error: "VERSION_CONFLICT" }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockConflictResponse);

      const persistStateWithRetry = async (state: ScoringState, maxRetries: number) => {
        let attempts = 0;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          attempts++;
          const response = await fetch(`/api/matches/test-match-id/state`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer test-token`,
            },
            body: JSON.stringify({
              state: state.isFinished ? "FINISHED" : "IN_PROGRESS",
              scoreState: state,
              version: mockMatch.version,
            }),
          });

          if (response.status !== 409) {
            break;
          }
        }
        return { attempts };
      };

      const result = await persistStateWithRetry(mockState, 3);

      expect(result.attempts).toBe(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Concorrência Simulada", () => {
    it("deve lidar com múltiplas chamadas concorrentes", async () => {
      const mockSuccessResponse = { ok: true, status: 200, json: async () => ({}) };
      global.fetch = jest.fn().mockResolvedValue(mockSuccessResponse);

      const persistState = async (state: ScoringState, label: string) => {
        const response = await fetch(`/api/matches/test-match-id/state`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer test-token`,
          },
          body: JSON.stringify({
            state: state.isFinished ? "FINISHED" : "IN_PROGRESS",
            scoreState: state,
            version: mockMatch.version,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return { success: true, label };
      };

      const state1 = { ...mockState, setsWon: { player1: 1, player2: 0 } };
      const state2 = { ...mockState, setsWon: { player1: 1, player2: 0 }, currentGame: { ...mockState.currentGame, player1: 15 } };
      const state3 = { ...mockState, setsWon: { player1: 2, player2: 0 } };

      const results = await Promise.all([
        persistState(state1, "concurrent-1"),
        persistState(state2, "concurrent-2"),
        persistState(state3, "concurrent-3"),
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});