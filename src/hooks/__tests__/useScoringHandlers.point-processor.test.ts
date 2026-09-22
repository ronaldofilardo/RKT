/**
 * Regressão do bug de perda silenciosa de anotação (ACE/dupla falta/rally)
 * quando as 2 tentativas de sync online falham em sequência.
 *
 * Antes do fix: após a 2ª falha (needsResync), o código só chamava
 * fetchMatch(true) e setError(...) — o ponto (com rallyDetails /
 * firstFaultDetail) era descartado para sempre, sem ser reenfileirado.
 *
 * Depois do fix: o ponto deve ser reenfileirado via
 * pointSync.queuePointForOffline(enqueue, flow) para reenvio automático.
 */

import { createPointProcessorService } from "@/hooks/useScoringHandlers.point-processor.service";

jest.mock("@/lib/logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  },
}));

function makeEngine(overrides: Partial<Record<string, any>> = {}) {
  return {
    getState: jest.fn().mockReturnValue({ isFinished: false, sets: [] }),
    applyPoint: jest.fn(),
    getPointHistory: jest.fn().mockReturnValue([]),
    restorePointHistory: jest.fn(),
    ...overrides,
  };
}

const baseMatch = {
  id: "match-1",
  state: "IN_PROGRESS",
  format: "MATCH_TB_10",
  player1: { id: "p1", name: "Alice" },
  player2: { id: "p2", name: "Bob" },
  initialServerId: "p1",
};

const rallyFlow = {
  winnerId: "p1",
  type: "ACE" as const,
  serverId: "p1",
  timestamp: Date.now(),
  isFirstServe: true,
  isSecondServe: false,
  rallyDetails: { tipo: "winner", previewBalls: 1 },
  rallyLength: 1,
  firstFaultDetail: undefined,
};

function createDeps(overrides: Partial<Record<string, any>> = {}) {
  const engine = makeEngine();
  const enqueue = jest.fn().mockResolvedValue({ id: "queued-1" });
  const queuePointForOffline = jest.fn().mockResolvedValue({ id: "queued-1" });
  const syncPointToServer = jest.fn();
  const setError = jest.fn();
  const fetchMatch = jest.fn().mockResolvedValue(undefined);

  const deps: any = {
    match: baseMatch,
    isOnline: true,
    enqueue,
    engineRef: { current: engine },
    tokenRef: { current: "token" },
    modalParamsRef: { current: {} },
    pointSequenceRef: { current: 0 },
    matchVersionRef: { current: 1 },
    lastPointLogIdRef: { current: null },
    isProcessingRef: { current: false },
    serveErrorState: { firstServeError: null, serveStep: "none" },
    serverHelpers: { getServerId: () => "p1" },
    pointSync: { syncPointToServer, queuePointForOffline },
    closeAll: jest.fn(),
    setScoreState: jest.fn(),
    setPointsHistory: jest.fn(),
    setMatch: jest.fn(),
    setShowFinishedBanner: jest.fn(),
    setError,
    fetchMatch,
    ...overrides,
  };

  return { deps, engine, enqueue, queuePointForOffline, syncPointToServer, setError, fetchMatch };
}

describe("createPointProcessorService — regressão de perda de anotação após 2ª falha", () => {
  it("reenfileira o ponto (com rallyDetails/firstFaultDetail) na fila offline em vez de descartá-lo quando as 2 tentativas de sync falham", async () => {
    const { deps, queuePointForOffline, syncPointToServer, setError, fetchMatch } = createDeps();

    // As duas tentativas falham com needsResync (ex.: timeout / erro de rede)
    syncPointToServer.mockResolvedValue({ success: false, needsResync: true });

    const { processPoint } = createPointProcessorService(deps);
    await processPoint(rallyFlow);

    expect(syncPointToServer).toHaveBeenCalledTimes(2);
    expect(fetchMatch).toHaveBeenCalledTimes(2);

    // Antes do fix isso nunca era chamado e o ponto era perdido.
    expect(queuePointForOffline).toHaveBeenCalledTimes(1);
    expect(queuePointForOffline).toHaveBeenCalledWith(deps.enqueue, rallyFlow);

    // Mensagem não deve mais afirmar que o ponto "não foi registrado" sem
    // dizer o que acontece com ele — deve indicar que foi salvo localmente.
    expect(setError).toHaveBeenCalledWith(
      expect.stringContaining("salvo neste dispositivo"),
    );
  });

  it("NÃO reenfileira quando a 1ª tentativa já tem sucesso", async () => {
    const { deps, queuePointForOffline, syncPointToServer } = createDeps();

    syncPointToServer.mockResolvedValueOnce({
      success: true,
      needsResync: false,
      serverResponse: {
        scoreState: { sets: [], isFinished: false },
        version: 2,
        pointLogId: "log-1",
      },
    });

    const { processPoint } = createPointProcessorService(deps);
    await processPoint(rallyFlow);

    expect(syncPointToServer).toHaveBeenCalledTimes(1);
    expect(queuePointForOffline).not.toHaveBeenCalled();
  });

  it("NÃO reenfileira quando o retry (2ª tentativa) tem sucesso", async () => {
    const { deps, queuePointForOffline, syncPointToServer, setError } = createDeps();

    syncPointToServer
      .mockResolvedValueOnce({ success: false, needsResync: true })
      .mockResolvedValueOnce({
        success: true,
        needsResync: false,
        serverResponse: {
          scoreState: { sets: [], isFinished: false },
          version: 2,
          pointLogId: "log-1",
        },
      });

    const { processPoint } = createPointProcessorService(deps);
    await processPoint(rallyFlow);

    expect(syncPointToServer).toHaveBeenCalledTimes(2);
    expect(queuePointForOffline).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith(null);
  });

  it("enfileira diretamente (sem tentar o servidor) quando isOnline é false, preservando rallyDetails/firstFaultDetail", async () => {
    const { deps, queuePointForOffline, syncPointToServer } = createDeps({ isOnline: false });

    const { processPoint } = createPointProcessorService(deps);
    await processPoint(rallyFlow);

    expect(syncPointToServer).not.toHaveBeenCalled();
    expect(queuePointForOffline).toHaveBeenCalledWith(deps.enqueue, rallyFlow);
  });
});
