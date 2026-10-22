/**
 * Caracterização de `applySuccessResult` (point-processor.service):
 * - desembrulhamento do scoreState do servidor (plano vs envelope `{state, history}`);
 * - proteção de tiebreak mismatch (servidor sem tiebreak → mantém estado local);
 * - persistência de versão/pointLogId nas refs.
 */
import { ScoringEngine } from "@/core/scoring/engine";
import { logger } from "@/lib/logger";
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

const SERVER_SET = {
  player1: 6,
  player2: 4,
  isTiebreak: false,
  tiebreakScore: null,
};

const serverPlainState = {
  sets: [SERVER_SET],
  setsWon: { player1: 1, player2: 0 },
  isFinished: false,
  server: "player1",
};

const LOCAL_TIEBREAK_STATE = {
  sets: [
    {
      player1: 6,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 5, player2: 4 },
    },
  ],
  isFinished: false,
};

function createDeps(overrides: Partial<Record<string, any>> = {}) {
  const engine = makeEngine();
  const deps: any = {
    match: baseMatch,
    isOnline: true,
    enqueue: jest.fn().mockResolvedValue({ id: "queued-1" }),
    engineRef: { current: engine },
    tokenRef: { current: "token" },
    modalParamsRef: { current: {} },
    pointSequenceRef: { current: 0 },
    matchVersionRef: { current: 1 },
    lastPointLogIdRef: { current: null },
    isProcessingRef: { current: false },
    serveErrorState: { firstServeError: null, serveStep: "none" },
    serverHelpers: { getServerId: () => "p1" },
    pointSync: {
      syncPointToServer: jest.fn(),
      queuePointForOffline: jest.fn().mockResolvedValue({ id: "queued-1" }),
    },
    closeAll: jest.fn(),
    setScoreState: jest.fn(),
    setPointsHistory: jest.fn(),
    setMatch: jest.fn(),
    setShowFinishedBanner: jest.fn(),
    setError: jest.fn(),
    fetchMatch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { deps, engine };
}

describe("point-processor.applySuccessResult - caracterização", () => {
  let appliedEngine: { restorePointHistory: jest.Mock };
  let fromSerializedSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    appliedEngine = { restorePointHistory: jest.fn() };
    fromSerializedSpy = jest
      .spyOn(ScoringEngine, "fromSerialized")
      .mockReturnValue(appliedEngine as any);
  });

  afterEach(() => {
    fromSerializedSpy.mockRestore();
  });

  it("estado plano: aplica o estado do servidor, restaura history local e persiste versão/pointLogId", async () => {
    const { deps, engine } = createDeps();
    const localHistory = [{ sequenceNumber: 1 }];
    engine.getState.mockReturnValue({
      isFinished: false,
      sets: [{ player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }],
    });
    engine.getPointHistory.mockReturnValue(localHistory);
    deps.pointSync.syncPointToServer.mockResolvedValue({
      success: true,
      serverResponse: { scoreState: serverPlainState, version: 7, pointLogId: "log-1" },
    });

    const { applyPoint } = createPointProcessorService(deps);
    const result = await applyPoint(rallyFlow);

    expect(result).toBe("log-1");
    expect(deps.setScoreState).toHaveBeenCalledWith({
      type: "POINT_APPLIED",
      payload: serverPlainState,
    });
    expect(appliedEngine.restorePointHistory).toHaveBeenCalledWith(localHistory);
    expect(deps.matchVersionRef.current).toBe(7);
    expect(deps.lastPointLogIdRef.current).toBe("log-1");
    expect(deps.setMatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it("envelope {state, history}: aplica o estado interno e restaura o history do envelope", async () => {
    const { deps } = createDeps();
    const envelopeHistory = [{ sequenceNumber: 9 }];
    deps.pointSync.syncPointToServer.mockResolvedValue({
      success: true,
      serverResponse: {
        scoreState: { state: serverPlainState, history: envelopeHistory },
        version: 3,
        pointLogId: "log-2",
      },
    });

    const { applyPoint } = createPointProcessorService(deps);
    const result = await applyPoint(rallyFlow);

    expect(result).toBe("log-2");
    expect(deps.setScoreState).toHaveBeenCalledWith({
      type: "POINT_APPLIED",
      payload: serverPlainState,
    });
    expect(appliedEngine.restorePointHistory).toHaveBeenCalledWith(envelopeHistory);
  });

  it("tiebreak mismatch (local com tiebreak, servidor sem): mantém estado local e registra warn", async () => {
    const { deps, engine } = createDeps();
    engine.getState.mockReturnValue(LOCAL_TIEBREAK_STATE);
    deps.pointSync.syncPointToServer.mockResolvedValue({
      success: true,
      serverResponse: { scoreState: serverPlainState, version: 7, pointLogId: "log-3" },
    });

    const { applyPoint } = createPointProcessorService(deps);
    const result = await applyPoint(rallyFlow);

    expect(result).toBe("log-3");
    expect(deps.setScoreState).toHaveBeenCalledTimes(1);
    expect(deps.setScoreState).toHaveBeenCalledWith({
      type: "POINT_APPLIED",
      payload: LOCAL_TIEBREAK_STATE,
    });
    expect(deps.setScoreState).not.toHaveBeenCalledWith({
      type: "POINT_APPLIED",
      payload: serverPlainState,
    });
    expect(deps.engineRef.current).toBe(engine);
    expect(logger.warn).toHaveBeenCalledWith(
      "[applyPoint] server response missing tiebreak info — keeping local state",
      { localSets: 1, serverSets: 1 },
    );
    expect(deps.matchVersionRef.current).toBe(7);
    expect(deps.lastPointLogIdRef.current).toBe("log-3");
  });

  it("resposta sem version/pointLogId: refs permanecem inalteradas", async () => {
    const { deps } = createDeps();
    deps.pointSync.syncPointToServer.mockResolvedValue({
      success: true,
      serverResponse: { scoreState: serverPlainState },
    });

    const { applyPoint } = createPointProcessorService(deps);
    const result = await applyPoint(rallyFlow);

    expect(result).toBeUndefined();
    expect(deps.matchVersionRef.current).toBe(1);
    expect(deps.lastPointLogIdRef.current).toBeNull();
    expect(deps.setMatch).not.toHaveBeenCalled();
  });
});
