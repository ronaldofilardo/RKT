/**
 * Characterization tests for logger and constants modules.
 *
 * Estes testes existem ANTES de qualquer mudança futura nos módulos para:
 * - Capturar o comportamento atual documentado
 * - Detectar regressões acidentais
 * - Servir como contrato executável
 */

import { logger } from "@/lib/logger";
import { TIMEOUTS, PERSIST, calculateBackoffDelay } from "@/lib/constants";

describe("logger namespace", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("logger.log e logger.debug (filtrados por NODE_ENV)", () => {
    it("logger.log existe como função", () => {
      expect(typeof logger.log).toBe("function");
    });

    it("logger.debug existe como função", () => {
      expect(typeof logger.debug).toBe("function");
    });

    it("logger.log: ambiente de teste tem NODE_ENV=test (caracterização do ambiente)", () => {
      expect(process.env.NODE_ENV).toBe("test");
    });

    it("logger.debug: ambiente de teste tem NODE_ENV=test (caracterização)", () => {
      expect(process.env.NODE_ENV).not.toBe("development");
    });
  });

  describe("logger.warn e logger.error (sempre ativos)", () => {
    it("logger.warn chama console.warn em qualquer ambiente", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation();
      logger.warn("warning");
      expect(spy).toHaveBeenCalledWith("warning");
    });

    it("logger.error chama console.error em qualquer ambiente", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      logger.error("error");
      expect(spy).toHaveBeenCalledWith("error");
    });
  });

  describe("logger.point.* (point-scoped)", () => {
    it("logger.point.matchNotFound chama console.error com ID", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      logger.point.matchNotFound("match-123");
      expect(spy).toHaveBeenCalledWith("[POINT] Match not found:", "match-123");
    });

    it("logger.point.sequenceConflict chama console.error com info estruturada", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      logger.point.sequenceConflict({ expected: 5, received: 3 });
      expect(spy).toHaveBeenCalledWith("[POINT] Sequence conflict:", { expected: 5, received: 3 });
    });

    it("logger.point.requestTimeout chama console.error com mensagem fixa", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      logger.point.requestTimeout();
      expect(spy).toHaveBeenCalledWith("[syncPointToServer] Request timeout");
    });

    it("logger.point.request existe como função (filtra console.log em test env)", () => {
      expect(typeof logger.point.request).toBe("function");
    });
  });

  describe("logger.match.* (match-scoped)", () => {
    it("logger.match.created existe como função (filtra console.log em test env)", () => {
      expect(typeof logger.match.created).toBe("function");
    });
  });

  describe("logger.session.* (session-scoped)", () => {
    it("logger.session.listingStart existe como função (filtra console.log em test env)", () => {
      expect(typeof logger.session.listingStart).toBe("function");
    });

    it("logger.session.snapshotParseFailed chama console.error com erro", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      const error = new SyntaxError("invalid JSON");
      logger.session.snapshotParseFailed(error);
      expect(spy).toHaveBeenCalledWith("[suspended-sessions API] failed to parse:", error);
    });
  });

  describe("logger.sync.* (offline sync-scoped)", () => {
    it("logger.sync.starting existe como função (filtra console.log em test env)", () => {
      expect(typeof logger.sync.starting).toBe("function");
    });

    it("logger.sync.someFailed chama console.warn com count", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation();
      logger.sync.someFailed(2);
      expect(spy).toHaveBeenCalledWith("2 match(es) still pending sync");
    });

    it("logger.sync.failed chama console.error com matchId + erro", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      logger.sync.failed("match-456", new Error("network down"));
      expect(spy).toHaveBeenCalledWith("Failed to sync match match-456:", expect.any(Error));
    });
  });

  describe("logger.persist.* (state persistence-scoped)", () => {
    it("logger.persist.conflict chama console.info com label + versions", () => {
      const spy = jest.spyOn(console, "info").mockImplementation();
      logger.persist.conflict("undo", 5, 3);
      expect(spy).toHaveBeenCalledWith(
        "[persistState:undo] Conflito de versão detectado (servidor v5, cliente v3). Re-sincronizando...",
      );
    });

    it("logger.persist.maxRetriesExhausted chama console.error com label", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      logger.persist.maxRetriesExhausted("redo");
      expect(spy).toHaveBeenCalledWith("[persistState:redo] Max retries exhausted");
    });

    it("logger.persist.retrying existe como função (filtra console.log em test env)", () => {
      expect(typeof logger.persist.retrying).toBe("function");
    });
  });
});

describe("TIMEOUTS constants", () => {
  it("POINT_REQUEST_ABORT_MS é 10 segundos (caracterização histórica)", () => {
    expect(TIMEOUTS.POINT_REQUEST_ABORT_MS).toBe(10_000);
  });

  it("OFFLINE_SYNC_RETRY_MS é 30 segundos", () => {
    expect(TIMEOUTS.OFFLINE_SYNC_RETRY_MS).toBe(30_000);
  });

  it("PERSIST_BASE_DELAY_MS é 1 segundo", () => {
    expect(PERSIST.BASE_DELAY_MS).toBe(1_000);
  });
});

describe("PERSIST constants", () => {
  it("MAX_RETRIES é 3", () => {
    expect(PERSIST.MAX_RETRIES).toBe(3);
  });
});

describe("calculateBackoffDelay", () => {
  it("attempt=1 retorna baseDelay sem multiplicação", () => {
    expect(calculateBackoffDelay(1)).toBe(1_000);
  });

  it("attempt=2 retorna baseDelay * 2", () => {
    expect(calculateBackoffDelay(2)).toBe(2_000);
  });

  it("attempt=3 retorna baseDelay * 4", () => {
    expect(calculateBackoffDelay(3)).toBe(4_000);
  });

  it("respeita parâmetros customizados de base + multiplier", () => {
    expect(calculateBackoffDelay(2, 500, 3)).toBe(1_500);
  });

  it("caracterização: sequencia completa para 3 tentativas", () => {
    expect(calculateBackoffDelay(1)).toBe(1_000);
    expect(calculateBackoffDelay(2)).toBe(2_000);
    expect(calculateBackoffDelay(3)).toBe(4_000);
  });
});
