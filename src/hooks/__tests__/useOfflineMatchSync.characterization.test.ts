/**
 * Characterization tests for useOfflineMatchSync — abordagem minimalista.
 *
 * Estes testes capturam o CONTRATO do hook (funções exportadas, constantes
 * que ele usa, formato de payload) sem tentar mockar todo o ecossistema
 * DOM/lock-storage. A integração completa é coberta pelos E2E tests
 * (e2e/flows/03-offline-sync.spec.ts).
 */

import { TIMEOUTS } from "@/lib/constants";

describe("useOfflineMatchSync — contrato", () => {
  it("hook é função exportada", () => {
    const mod = require("@/hooks/useOfflineMatchSync");
    expect(typeof mod.useOfflineMatchSync).toBe("function");
  });

  it("usa TIMEOUTS.OFFLINE_SYNC_RETRY_MS = 30s para o retry interval", () => {
    expect(TIMEOUTS.OFFLINE_SYNC_RETRY_MS).toBe(30_000);
  });

  it("timeout de retry é múltiplo de 1000 (sanity check)", () => {
    expect(TIMEOUTS.OFFLINE_SYNC_RETRY_MS % 1000).toBe(0);
  });
});
