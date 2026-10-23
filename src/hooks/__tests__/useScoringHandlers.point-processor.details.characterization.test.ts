/**
 * Characterization (R-15) pré-B-6b: confirmPointDetails do point-processor.
 * Congela: mapeamento details.tipo → flow.type; rallyLength (modal vs
 * previewBalls); firstFaultDetail/isFirstServe/isSecondServe do
 * serveErrorState; early-return sem winnerSide; pós-processamento
 * (clearFirstServeError + setServeStep) e os dois caminhos de áudio.
 */
import { ScoringEngine } from "@/core/scoring/engine";
import { logger } from "@/lib/logger";
import { createPointProcessorService } from "@/hooks/useScoringHandlers.point-processor.service";

jest.mock("@/lib/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
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

const SERVER_SET = { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null };
const serverPlainState = {
  sets: [SERVER_SET],
  setsWon: { player1: 1, player2: 0 },
  isFinished: false,
  server: "player1",
};

function createDeps(overrides: Partial<Record<string, any>> = {}) {
  const engine = makeEngine();
  const deps: any = {
    match: baseMatch,
    isOnline: false,
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
    clearFirstServeError: jest.fn(),
    setServeStep: jest.fn(),
    ...overrides,
  };
  return { deps, engine };
}

const details = {
  tipo: "winner",
  previewBalls: 3,
  hitterId: "p1",
  receiverId: "p2",
} as any;

function lastFlow(engine: { applyPoint: jest.Mock }) {
  return engine.applyPoint.mock.calls[engine.applyPoint.mock.calls.length - 1][0];
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("point-processor.confirmPointDetails - characterization pré-extração", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tipo 'winner' → flow WINNER; rallyLength vem do modal (parseInt) e winnerId do lado do modal", async () => {
    const { deps, engine } = createDeps({
      modalParamsRef: { current: { winner: "player1", rallyLength: "5" } },
    });
    const { confirmPointDetails } = createPointProcessorService(deps);

    confirmPointDetails(details);
    await flush();

    const flow = lastFlow(engine);
    expect(flow.type).toBe("WINNER");
    expect(flow.winnerId).toBe("p1");
    expect(flow.serverId).toBe("p1");
    expect(flow.rallyLength).toBe(5);
    expect(flow.rallyDetails).toBe(details);
    expect(flow.hitterId).toBe("p1");
    expect(flow.receiverId).toBe("p2");
    expect(deps.closeAll).toHaveBeenCalledTimes(1);
  });

  it("rallyLength sem valor numérico no modal cai em details.previewBalls; winner 'player2' → id do p2", async () => {
    const { deps, engine } = createDeps({
      modalParamsRef: { current: { winner: "player2" } },
    });
    const { confirmPointDetails } = createPointProcessorService(deps);

    confirmPointDetails(details);
    await flush();

    const flow = lastFlow(engine);
    expect(flow.winnerId).toBe("p2");
    expect(flow.rallyLength).toBe(3);
  });

  it("mapeamento de tipo: 'erro_forcado' → FORCED_ERROR e demais → UNFORCED_ERROR", async () => {
    const { deps, engine } = createDeps({
      modalParamsRef: { current: { winner: "player1" } },
    });
    const { confirmPointDetails } = createPointProcessorService(deps);

    confirmPointDetails({ ...details, tipo: "erro_forcado" } as any);
    await flush();
    expect(lastFlow(engine).type).toBe("FORCED_ERROR");

    confirmPointDetails({ ...details, tipo: "erro_nao_forcado" } as any);
    await flush();
    expect(lastFlow(engine).type).toBe("UNFORCED_ERROR");
  });

  it("serveErrorState: serveStep 'second' + firstServeError → isSecondServe, firstFaultDetail propagado", async () => {
    const { deps, engine } = createDeps({
      modalParamsRef: { current: { winner: "player1" } },
      serveErrorState: {
        serveStep: "second",
        firstServeError: { errorType: "out", serveEffect: "slice", direction: "wide" },
      },
    });
    const { confirmPointDetails } = createPointProcessorService(deps);

    confirmPointDetails(details);
    await flush();

    const flow = lastFlow(engine);
    expect(flow.isFirstServe).toBe(false);
    expect(flow.isSecondServe).toBe(true);
    expect(flow.firstFaultDetail).toEqual({
      errorType: "out",
      serveEffect: "slice",
      direction: "wide",
    });
  });

  it("sem winnerSide no modal: early-return sem closeAll nem processamento", async () => {
    const { deps, engine } = createDeps();
    const { confirmPointDetails } = createPointProcessorService(deps);

    confirmPointDetails(details);
    await flush();

    expect(deps.closeAll).not.toHaveBeenCalled();
    expect(engine.applyPoint).not.toHaveBeenCalled();
  });

  it("pós-processamento: clearFirstServeError + setServeStep('none') sempre que o ponto processa", async () => {
    const { deps } = createDeps({
      modalParamsRef: { current: { winner: "player1" } },
    });
    const { confirmPointDetails } = createPointProcessorService(deps);

    confirmPointDetails(details);
    await flush();

    expect(deps.clearFirstServeError).toHaveBeenCalledTimes(1);
    expect(deps.setServeStep).toHaveBeenCalledWith("none");
  });

  it("áudio offline (sem pointLogId): setError de áudio não sincronizado + logger.warn", async () => {
    const { deps } = createDeps({
      modalParamsRef: { current: { winner: "player1" } },
    });
    const { confirmPointDetails } = createPointProcessorService(deps);

    confirmPointDetails(details, { blob: new Blob(["x"]), durationMs: 1000 });
    await flush();

    expect(deps.setError).toHaveBeenCalledWith(
      "O ponto foi salvo, mas o áudio da anotação não pôde ser sincronizado no momento (requer conexão ativa)."
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "[confirmPointDetails] Áudio gravado não pôde ser enviado imediatamente (modo offline ou sem pointLogId)",
      { matchId: "match-1" }
    );
  });

  it("áudio online com pointLogId: uploadAudioNote(matchId, pointLogId, blob, durationMs, token) + onAudioUploaded", async () => {
    const fromSerializedSpy = jest
      .spyOn(ScoringEngine, "fromSerialized")
      .mockReturnValue({ restorePointHistory: jest.fn() } as any);
    const uploadAudioNote = jest.fn().mockResolvedValue(undefined);
    const onAudioUploaded = jest.fn();
    const { deps } = createDeps({
      isOnline: true,
      modalParamsRef: { current: { winner: "player1" } },
      uploadAudioNote,
      onAudioUploaded,
    });
    deps.pointSync.syncPointToServer.mockResolvedValue({
      success: true,
      serverResponse: { scoreState: serverPlainState, version: 7, pointLogId: "log-9" },
    });

    const { confirmPointDetails } = createPointProcessorService(deps);
    const audio = { blob: new Blob(["x"]), durationMs: 2500 };
    confirmPointDetails(details, audio);
    await flush();

    expect(uploadAudioNote).toHaveBeenCalledWith("match-1", "log-9", audio.blob, 2500, "token");
    expect(onAudioUploaded).toHaveBeenCalledTimes(1);
    fromSerializedSpy.mockRestore();
  });
});
