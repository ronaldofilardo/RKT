/**
 * Characterization tests for createPointSyncService (extracted service).
 *
 * Captura o comportamento atual documentado do service refatorado:
 * - Sync online para /api/matches/{id}/point
 * - Timeout via AbortController usando TIMEOUTS_MS.POINT_REQUEST_ABORT
 * - Tratamento de 409 SEQUENCE_CONFLICT
 * - Tratamento de AbortError
 * - Logging via logger.point.*
 */

import { createPointSyncService } from "@/hooks/useScoringHandlers.point-sync";
import type { MatchData } from "@/hooks/useScoringHandlers";
import { TIMEOUTS } from "@/lib/constants";

const baseMatch: MatchData = {
  id: "match-1",
  version: 1,
  state: "IN_PROGRESS",
  format: "MATCH_TB_10" as any,
  player1Id: "p1",
  player2Id: "p2",
  initialServerId: "p1",
  player1: { id: "p1", name: "Alice" },
  player2: { id: "p2", name: "Bob" },
};

const baseFlow = {
  winnerId: "p1",
  type: "WINNER" as const,
  serverId: "p1",
  timestamp: Date.now(),
};

function createService(overrides: Partial<Parameters<typeof createPointSyncService>[0]> = {}) {
  const pointSequenceRef = { current: 0 };
  const tokenRef = { current: "test-token" };
  const setError = jest.fn();

  const service = createPointSyncService({
    matchId: "match-1",
    match: baseMatch,
    tokenRef,
    pointSequenceRef,
    setError,
    ...overrides,
  });

  return { service, pointSequenceRef, tokenRef, setError };
}

describe("createPointSyncService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("retorna needsResync=true se match for null", async () => {
    const { service } = createService({ match: null });
    const result = await service.syncPointToServer(baseFlow, 1);
    expect(result).toEqual({ success: false, needsResync: true });
  });

  it("envia POST para /api/matches/{id}/point com payload correto", async () => {
    const { service } = createService();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scoreState: {}, version: 2 }),
    });

    await service.syncPointToServer(baseFlow, 1);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/matches/match-1/point");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.authorization).toBe("Bearer test-token");

    const body = JSON.parse(init.body);
    expect(body.winnerId).toBe("p1");
    expect(body.type).toBe("WINNER");
    expect(body.sequenceNumber).toBe(1);
  });

  it("retorna success=true com serverResponse no caminho feliz", async () => {
    const { service } = createService();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scoreState: { sets: [] }, version: 2 }),
    });

    const result = await service.syncPointToServer(baseFlow, 1);
    expect(result.success).toBe(true);
    expect(result.needsResync).toBe(false);
    expect(result.serverResponse).toEqual({ scoreState: { sets: [] }, version: 2 });
  });

  it("retorna success=true mesmo se body parse falhar (res.ok=true)", async () => {
    const { service } = createService();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError("bad json");
      },
    });

    const result = await service.syncPointToServer(baseFlow, 1);
    expect(result.success).toBe(true);
    expect(result.needsResync).toBe(false);
  });

  it("atualiza pointSequenceRef.current em 409 SEQUENCE_CONFLICT", async () => {
    const { service, pointSequenceRef } = createService();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: async () => ({
        error: "SEQUENCE_CONFLICT",
        expectedSequence: 10,
      }),
    });

    const result = await service.syncPointToServer(baseFlow, 1);
    expect(result.success).toBe(false);
    expect(result.needsResync).toBe(true);
    expect(pointSequenceRef.current).toBe(9);
    expect(service).toBeDefined();
  });

  it("não atualiza pointSequenceRef se 409 não for SEQUENCE_CONFLICT", async () => {
    const { service, pointSequenceRef } = createService();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: async () => ({ error: "OTHER_CONFLICT" }),
    });

    await service.syncPointToServer(baseFlow, 1);
    expect(pointSequenceRef.current).toBe(0);
  });

  it("retorna needsResync=true em erro HTTP 500 com error no body", async () => {
    const { service, setError } = createService();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 500,
      ok: false,
      json: async () => ({ error: "DB_ERROR", message: "deadlock" }),
    });

    const result = await service.syncPointToServer(baseFlow, 1);
    expect(result.success).toBe(false);
    expect(result.needsResync).toBe(true);
    expect(setError).toHaveBeenCalledWith(
      expect.stringContaining("DB_ERROR"),
    );
  });

  it("retorna needsResync=true quando fetch retorna null (network failure)", async () => {
    const { service } = createService();
    (global.fetch as jest.Mock).mockImplementation(() => null);

    const result = await service.syncPointToServer(baseFlow, 1);
    expect(result).toEqual({ success: false, needsResync: true });
  });

  it("usa TIMEOUTS.POINT_REQUEST_ABORT_MS no AbortController", async () => {
    const { service } = createService();

    const realSetTimeout = global.setTimeout;
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    void service.syncPointToServer(baseFlow, 1);

    await Promise.resolve();

    const abortCall = setTimeoutSpy.mock.calls.find(
      (call) => typeof call[1] === "number" && call[1] === TIMEOUTS.POINT_REQUEST_ABORT_MS,
    );
    expect(abortCall).toBeDefined();
    expect(abortCall![1]).toBe(10_000);

    setTimeoutSpy.mockRestore();
    realSetTimeout(() => undefined, 0);
  });

  it("queuePointForOffline chama enqueue com type POINT", async () => {
    const { service } = createService();
    const enqueue = jest.fn().mockResolvedValue(undefined);

    await service.queuePointForOffline(enqueue, baseFlow);

    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: "match-1",
        type: "POINT",
        payload: baseFlow,
        timestamp: expect.any(Number),
      }),
    );
  });
});
