/**
 * @jest-environment jsdom
 *
 * Characterization tests — Design Pattern (tokens telemetry-*)
 *
 * Objetivo: capturar o comportamento ATUAL das classes CSS apos a correcao
 * de regressao visual (2026-09-30). Garante que os componentes extraidos
 * na refatoracao usem o design system (telemetry-*) e nao classes Tailwind
 * genericas (bg-gray-*).
 *
 * NUNCA altere estes testes sem revisar se o design system foi intencionalmente
 * modificado. Eles atuam como "golden snapshots" de CSS.
 */
import React from "react";
import { render } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "design-test-match" }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/useOfflineSync", () => ({
  useOfflineSync: () => ({ enqueue: jest.fn(), isOnline: true, flush: jest.fn() }),
}));

jest.mock("@/hooks/useOfflineMatchSync", () => ({
  useOfflineMatchSync: () => ({ syncPendingMatches: jest.fn() }),
}));

jest.mock("@/components/Toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/hooks/useScoreboardUIState", () => ({
  useScoreboardUIState: () => ({
    state: { serveStep: "none", firstServeError: null },
    handleServeErrorOpen: jest.fn(),
    handleServeErrorClose: jest.fn(),
    handleFirstServeErrorSet: jest.fn(),
    handleFirstServeErrorClear: jest.fn(),
    setServeStep: jest.fn(),
  }),
}));

jest.mock("@/hooks/useSessionManager", () => ({
  useSessionManager: () => ({
    abandonCurrentSession: jest.fn(),
    handleEditScore: jest.fn(),
  }),
}));

jest.mock("@/contexts/SessionContext", () => ({
  useSession: () => ({
    session: { pendingEditScore: null },
    restoreFromSessionStorage: jest.fn(),
    clearPendingEdit: jest.fn(),
    updateScore: jest.fn(),
  }),
}));

jest.mock("@/hooks/useModalStack", () => ({
  useModalStack: () => ({
    activeModal: null,
    modalParams: {},
    open: jest.fn(),
    close: jest.fn(),
    closeAll: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("@/components/scoring/MatchHeader", () => ({
  MatchHeader: () => React.createElement("div", { "data-testid": "match-header" }),
}));
jest.mock("@/components/scoring/PlayerCard", () => ({
  PlayerCard: () => React.createElement("div", { "data-testid": "player-card" }),
}));
jest.mock("@/components/scoring/VSIndicator", () => ({ VSIndicator: () => React.createElement("div") }));
jest.mock("@/components/scoring/ContextBadges", () => ({ ContextBadges: () => React.createElement("div") }));
jest.mock("@/components/scoring/ScoreboardCard", () => ({ ScoreboardCard: () => React.createElement("div") }));
jest.mock("@/components/scoring/ActionBar", () => ({
  ActionBar: () => React.createElement("div", { "data-testid": "action-bar" }),
}));
jest.mock("@/components/scoring/SetupModal", () => ({ SetupModal: () => React.createElement("div") }));
jest.mock("@/components/scoring/UndoConfirmModal", () => ({ UndoConfirmModal: () => React.createElement("div") }));
jest.mock("@/components/scoring/PointDetailsModal", () => ({ PointDetailsModal: () => React.createElement("div") }));
jest.mock("@/components/scoring/ServerEffectModal", () => ({ ServerEffectModal: () => React.createElement("div") }));
jest.mock("@/components/scoring/EditScoreModal", () => ({ EditScoreModal: () => React.createElement("div") }));
jest.mock("@/components/scoring/MatchTimelineView", () => ({ MatchTimelineView: () => React.createElement("div") }));
jest.mock("@/components/scoring/CourtBackground", () => ({ __esModule: true, default: () => React.createElement("div") }));
jest.mock("@/components/scoring/AnnotationSessionPanel", () => ({ AnnotationSessionPanel: () => React.createElement("div") }));
jest.mock("@/components/scoring/LiveCountersBar", () => ({ LiveCountersBar: () => React.createElement("div") }));
jest.mock("@/components/scoring/TacticalInsightBanner", () => ({ TacticalInsightBanner: () => React.createElement("div") }));
jest.mock("@/components/scoring/SetSummaryModal", () => ({ SetSummaryModal: () => React.createElement("div") }));
jest.mock("@/components/scoring/CommentModal", () => ({ CommentModal: () => React.createElement("div") }));

const baseMatch = {
  id: "design-test-match",
  format: "BEST_OF_3",
  player1: { id: "p1", name: "Player 1" },
  player2: { id: "p2", name: "Player 2" },
  initialServerId: "p1",
  courtType: "CLAY",
  sportType: "TENNIS",
  state: "IN_PROGRESS",
  version: 1,
  _count: { pointLog: 0 },
  scoreState: {
    sets: [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: "player1",
    setsWon: { player1: 0, player2: 0 },
    isFinished: false,
    winner: null,
    startedAt: Date.now(),
    secondServe: false,
  },
};

function hasGrayClass(container: HTMLElement): boolean {
  return Array.from(container.querySelectorAll("[class]")).some((el) =>
    /bg-gray-[0-9]|border-gray-[0-9]/.test(el.getAttribute("class") ?? ""),
  );
}

function hasSlateOrGrayClass(container: HTMLElement): boolean {
  return Array.from(container.querySelectorAll("[class]")).some((el) =>
    /(bg|text|border)-(gray|slate)-[0-9]/.test(el.getAttribute("class") ?? ""),
  );
}

// ─── ScoringPage ──────────────────────────────────────────────────────────────

describe("ScoringPage - Design Pattern (telemetry tokens)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
  });

  it("NAO usa bg-gray-900 no container raiz (regressao visual)", async () => {
    const ScoringPage = (await import("../page")).default;
    const { container } = render(React.createElement(ScoringPage));
    expect(hasGrayClass(container)).toBe(false);
  });

  it("NAO usa bg-gray-800 em nenhum elemento durante loading (regressao visual)", async () => {
    const ScoringPage = (await import("../page")).default;
    const { container } = render(React.createElement(ScoringPage));
    expect(hasGrayClass(container)).toBe(false);
  });
});

// ─── ScoringTimelineView ──────────────────────────────────────────────────────

describe("ScoringTimelineView - Design Pattern (telemetry tokens)", () => {
  const baseProps = {
    fontScale: 1,
    elapsed: 0,
    isFinished: false,
    abandonCurrentSession: jest.fn().mockResolvedValue(undefined),
    onCloseTimeline: jest.fn(),
    matchId: "x",
    timelinePoints: [] as any[],
    player1Name: "P1",
    player2Name: "P2",
    onNavigateReport: jest.fn(),
    onNavigateDashboard: jest.fn(),
  };

  it("NAO usa classes bg-gray-* / border-gray-* em nenhum no", async () => {
    const { ScoringTimelineView } = await import("../ScoringTimelineView");
    const { container } = render(React.createElement(ScoringTimelineView, baseProps));
    expect(hasGrayClass(container)).toBe(false);
  });

  it("container raiz tem classe bg-telemetry-base", async () => {
    const { ScoringTimelineView } = await import("../ScoringTimelineView");
    const { container } = render(React.createElement(ScoringTimelineView, baseProps));
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("bg-telemetry-base");
  });

  it('botao Placar usa bg-telemetry-card e NAO usa bg-gray-*', async () => {
    const { ScoringTimelineView } = await import("../ScoringTimelineView");
    const { getByText } = render(React.createElement(ScoringTimelineView, baseProps));
    const btn = getByText(/Placar/);
    expect(btn.className).toContain("bg-telemetry-card");
    expect(btn.className).not.toMatch(/bg-gray-[0-9]/);
  });
});

// ─── ScoringPlayArea ──────────────────────────────────────────────────────────

describe("ScoringPlayArea - Design Pattern (telemetry tokens)", () => {
  const baseProps: any = {
    match: baseMatch,
    effectiveScoreState: baseMatch.scoreState,
    suspendedSession: null,
    liveCounters: {
      totalPoints: 0, aces: 0, doubleFaults: 0, winners: 0,
      unforcedErrors: 0, forcedErrors: 0, netPoints: 0, breakPoints: 0,
      breakPointsConverted: 0, longestRally: 0, avgRallyLength: 0,
    },
    tacticalInsights: [],
    completedSetsCount: 0,
    p1IsServing: true,
    p2IsServing: false,
    isSetPoint: false,
    isBreakPoint: false,
    isMatchPoint: false,
    isTiebreak: false,
    isSuperTiebreak: false,
    winner: null,
    pointsHistory: [],
    scoreState: baseMatch.scoreState,
    isFinished: false,
    matchId: "x",
    onOpenSetSummary: jest.fn(),
    onPoint: jest.fn(),
    onSwipeUndo: jest.fn(),
    onNavigateReport: jest.fn(),
    onRegisterAndExit: jest.fn().mockResolvedValue(undefined),
  };

  it("NAO usa classes bg-gray-* no container de jogo", async () => {
    const { ScoringPlayArea } = await import("../ScoringPlayArea");
    const { container } = render(React.createElement(ScoringPlayArea, baseProps));
    expect(hasGrayClass(container)).toBe(false);
  });

  it("banner de partida finalizada usa text-telemetry-text-muted (NAO text-gray-400)", async () => {
    const { ScoringPlayArea } = await import("../ScoringPlayArea");
    const { container } = render(
      React.createElement(ScoringPlayArea, {
        ...baseProps,
        isFinished: true,
        winner: "player1",
        scoreState: { ...baseMatch.scoreState, setsWon: { player1: 2, player2: 0 } },
      }),
    );

    const setsEl = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent && /\d+ x \d+ sets/.test(p.textContent),
    );
    expect(setsEl).toBeTruthy();
    expect(setsEl?.className).toContain("text-telemetry-text-muted");
    expect(setsEl?.className).not.toContain("text-gray-400");
  });
});

// ─── LiveCountersBar ──────────────────────────────────────────────────────────

describe("LiveCountersBar - Design Pattern (telemetry tokens)", () => {
  const mockCounters = {
    aces: { p1: 2, p2: 1 },
    doubleFaults: { p1: 1, p2: 0 },
    breakPoints: {
      p1: { converted: 1, total: 2, pct: 50 },
      p2: { converted: 0, total: 1, pct: 0 },
    },
    breakPointsSaved: {
      p1: { saved: 1, total: 1, pct: 100 },
      p2: { saved: 1, total: 2, pct: 50 },
    },
    forcedErrors: { p1: 1, p2: 2 },
    unforcedErrors: { p1: 2, p2: 4 },
    totalPointsWon: { p1: 10, p2: 8 },
  };

  it("NAO usa classes slate-* ou gray-*", () => {
    const { LiveCountersBar } = jest.requireActual("@/components/scoring/LiveCountersBar");
    const { container } = render(
      React.createElement(LiveCountersBar, {
        counters: mockCounters,
        player1Name: "Carlos Alcaraz",
        player2Name: "Jannik Sinner",
      }),
    );
    expect(hasSlateOrGrayClass(container)).toBe(false);
  });

  it("usa tokens bg-telemetry-card e text-telemetry-*", () => {
    const { LiveCountersBar } = jest.requireActual("@/components/scoring/LiveCountersBar");
    const { container } = render(
      React.createElement(LiveCountersBar, {
        counters: mockCounters,
        player1Name: "Carlos Alcaraz",
        player2Name: "Jannik Sinner",
      }),
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("bg-telemetry-card");
    expect(container.querySelector(".text-telemetry-text-primary")).toBeTruthy();
    expect(container.querySelector(".text-telemetry-text-muted")).toBeTruthy();
  });
});

// ─── SetSummaryModal ──────────────────────────────────────────────────────────

describe("SetSummaryModal - Design Pattern (telemetry tokens)", () => {
  const mockPoints: any[] = [
    {
      pointNumber: 1,
      setNumber: 1,
      gameNumber: 1,
      winner: "player1",
      server: "player1",
      scoreBefore: "0-0",
      scoreAfter: "15-0",
      tags: ["ACE"],
      rallyLength: 1,
      gamesScore: { player1: 6, player2: 4 },
    },
  ];

  it("NAO usa classes slate-* ou gray-*", () => {
    const { SetSummaryModal } = jest.requireActual("@/components/scoring/SetSummaryModal");
    const { container } = render(
      React.createElement(SetSummaryModal, {
        isOpen: true,
        onClose: jest.fn(),
        timelinePoints: mockPoints,
        player1Name: "Carlos Alcaraz",
        player2Name: "Jannik Sinner",
        completedSetsCount: 1,
      }),
    );
    expect(hasSlateOrGrayClass(container)).toBe(false);
  });

  it("usa tokens bg-telemetry-elevated e bg-telemetry-card", () => {
    const { SetSummaryModal } = jest.requireActual("@/components/scoring/SetSummaryModal");
    const { container } = render(
      React.createElement(SetSummaryModal, {
        isOpen: true,
        onClose: jest.fn(),
        timelinePoints: mockPoints,
        player1Name: "Carlos Alcaraz",
        player2Name: "Jannik Sinner",
        completedSetsCount: 1,
      }),
    );
    expect(container.querySelector(".bg-telemetry-elevated")).toBeTruthy();
    expect(container.querySelector(".bg-telemetry-card")).toBeTruthy();
    expect(container.querySelector(".text-telemetry-text-primary")).toBeTruthy();
    expect(container.querySelector(".text-telemetry-text-muted")).toBeTruthy();
  });
});