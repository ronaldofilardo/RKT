/**
 * Testes para o helper withLocalStorageLock / appendPendingMatchSync.
 * Cobre race condition entre múltiplas "tabs" simuladas escrevendo no mesmo
 * localStorage key (pendingMatchSyncs).
 */

type StorageItem = { matchId: string; timestamp: number };

const STORAGE_KEY = "pendingMatchSyncs";
const LOCK_KEY = "pendingMatchSyncs.lock";

describe("offlineStorageSync", () => {
  let store: Record<string, string> = {};
  let listeners: Array<(e: StorageEvent) => void> = [];

  beforeEach(() => {
    store = {};
    listeners = [];
    (global as any).window = global;
    (global as any).localStorage = {
      getItem: jest.fn((key: string) => store[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = String(value);
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      key: jest.fn(),
    };
    (global as any).window.addEventListener = jest.fn(
      (type: string, cb: (e: StorageEvent) => void) => {
        if (type === "storage") listeners.push(cb);
      }
    );
    (global as any).window.removeEventListener = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (global as any).window;
    delete (global as any).localStorage;
  });

  async function loadModule() {
    jest.resetModules();
    return await import("@/lib/offlineStorageSync");
  }

  it("acquireLocalStorageLock: primeira chamada obtém lock", async () => {
    const mod = await loadModule();
    expect(mod.acquireLocalStorageLock()).toBe(true);
    expect(store[LOCK_KEY]).toBeDefined();
  });

  it("acquireLocalStorageLock: segunda chamada concorrente falha", async () => {
    const mod = await loadModule();
    expect(mod.acquireLocalStorageLock()).toBe(true);
    expect(mod.acquireLocalStorageLock()).toBe(false);
  });

  it("acquireLocalStorageLock: lock expira após TTL (simulação)", async () => {
    const mod = await loadModule();
    expect(mod.acquireLocalStorageLock()).toBe(true);

    // Simula um lock antigo (TTL 15s)
    const old = Date.now() - 20000;
    store[LOCK_KEY] = String(old);

    expect(mod.acquireLocalStorageLock()).toBe(true);
  });

  it("releaseLocalStorageLock: remove o lock do storage", async () => {
    const mod = await loadModule();
    mod.acquireLocalStorageLock();
    mod.releaseLocalStorageLock();
    expect(store[LOCK_KEY]).toBeUndefined();
  });

  it("withLocalStorageLock: executa fn e libera lock ao final", async () => {
    const mod = await loadModule();
    const result = await mod.withLocalStorageLock(async () => "ok");
    expect(result).toBe("ok");
    expect(store[LOCK_KEY]).toBeUndefined();
  });

  it("withLocalStorageLock: rejeita quando lock já está ocupado", async () => {
    const mod = await loadModule();
    mod.acquireLocalStorageLock();

    await expect(
      mod.withLocalStorageLock(async () => "shouldNotRun")
    ).rejects.toThrow("LOCK_HELD");
  });

  it("withLocalStorageLock: libera lock mesmo quando fn lança exceção", async () => {
    const mod = await loadModule();
    await expect(
      mod.withLocalStorageLock(async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    expect(store[LOCK_KEY]).toBeUndefined();
  });

  it("DUAS TABS concorrentes: apenas uma executa, outra é rejeitada", async () => {
    const mod = await loadModule();

    let executed = 0;

    const tab1 = mod
      .withLocalStorageLock(async () => {
        executed++;
        await new Promise((r) => setTimeout(r, 50));
        return "tab1-done";
      })
      .catch((e) => `rejected:${e.message}`);

    const tab2 = mod
      .withLocalStorageLock(async () => {
        executed++;
        return "tab2-done";
      })
      .catch((e) => `rejected:${e.message}`);

    const [r1, r2] = await Promise.all([tab1, tab2]);

    expect(executed).toBe(1);
    expect([r1, r2].sort()).toEqual(["rejected:LOCK_HELD", "tab1-done"]);
  });

  it("appendPendingMatchSync: lê, adiciona e escreve atomicamente", async () => {
    const mod = await loadModule();
    mod.appendPendingMatchSync<StorageItem>({
      matchId: "m1",
      timestamp: 1,
    });
    mod.appendPendingMatchSync<StorageItem>({
      matchId: "m2",
      timestamp: 2,
    });

    const items = mod.readPendingMatchSyncs<StorageItem>();
    expect(items).toHaveLength(2);
    expect(items[0].matchId).toBe("m1");
    expect(items[1].matchId).toBe("m2");
  });

  it("readPendingMatchSyncs: retorna [] quando localStorage está vazio", async () => {
    const mod = await loadModule();
    const items = mod.readPendingMatchSyncs<StorageItem>();
    expect(items).toEqual([]);
  });

  it("readPendingMatchSyncs: tolera JSON corrompido retornando []", async () => {
    const mod = await loadModule();
    store[STORAGE_KEY] = "not-valid-json)))";
    const items = mod.readPendingMatchSyncs<StorageItem>();
    expect(items).toEqual([]);
  });

  it("writePendingMatchSyncs: sobrescreve lista anterior", async () => {
    const mod = await loadModule();
    mod.writePendingMatchSyncs<StorageItem>([
      { matchId: "old", timestamp: 0 },
    ]);
    mod.writePendingMatchSyncs<StorageItem>([
      { matchId: "new", timestamp: 1 },
    ]);
    expect(mod.readPendingMatchSyncs<StorageItem>()).toHaveLength(1);
    expect(mod.readPendingMatchSyncs<StorageItem>()[0].matchId).toBe("new");
  });
});
