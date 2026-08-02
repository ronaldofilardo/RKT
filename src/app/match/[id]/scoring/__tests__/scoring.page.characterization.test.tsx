/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ScoringPage from "@/app/match/[id]/scoring/page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "test-match-id" }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/match/test-match-id/scoring",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/useOfflineSync", () => ({
  useOfflineSync: () => ({
    enqueue: jest.fn(),
    isOnline: true,
    flush: jest.fn(),
  }),
}));

jest.mock("@/hooks/useOfflineMatchSync", () => ({
  useOfflineMatchSync: () => ({
    syncPendingMatches: jest.fn(),
  }),
}));

jest.mock("@/components/Toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
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

let mockModalStack = {
  activeModal: null as string | null,
  modalParams: {} as Record<string, string>,
  open: jest.fn(),
  close: jest.fn(),
  closeAll: jest.fn(),
  replace: jest.fn(),
};

jest.mock("@/hooks/useModalStack", () => ({
  useModalStack: () => mockModalStack,
}));

jest.mock("@/components/scoring/MatchHeader", () => ({
  MatchHeader: ({ onClose, onTimeline, isFinished }: any) => (
    <div data-testid="match-header">
      <button onClick={onClose}>Close</button>
      <button onClick={onTimeline}>Timeline</button>
      <span data-testid="is-finished">{String(isFinished)}</span>
    </div>
  ),
}));

jest.mock("@/components/scoring/PlayerCard", () => ({
  PlayerCard: (props: any) => (
    <div data-testid={`player-card-${props.side}`}>
      {props.player?.name}
      <span data-testid={`is-serving-${props.side}`}>{String(props.isServing)}</span>
      <span data-testid={`is-winner-${props.side}`}>{String(props.isWinner)}</span>
      <button onClick={props.onPoint}>Point</button>
      <button onClick={props.onSwipeDown}>Swipe</button>
      <span data-testid={`disabled-${props.side}`}>{String(props.disabled)}</span>
    </div>
  ),
}));

jest.mock("@/components/scoring/VSIndicator", () => ({
  VSIndicator: () => <div data-testid="vs-indicator" />,
}));

jest.mock("@/components/scoring/ContextBadges", () => ({
  ContextBadges: () => <div data-testid="context-badges" />,
}));

jest.mock("@/components/scoring/ScoreboardCard", () => ({
  ScoreboardCard: () => <div data-testid="scoreboard-card" />,
}));

jest.mock("@/components/scoring/ActionBar", () => ({
  ActionBar: (props: any) => (
    <div data-testid="action-bar">
      <span data-testid="can-undo">{String(props.canUndo)}</span>
      <span data-testid="can-redo">{String(props.canRedo)}</span>
      <span data-testid="is-finished-action">{String(props.isFinished)}</span>
      <span data-testid="is-processing">{String(props.isProcessing)}</span>
      <button onClick={props.onUndo}>Undo</button>
      <button onClick={props.onRedo}>Redo</button>
      <button onClick={props.onFontSmaller}>A−</button>
      <button onClick={props.onFontBigger}>A+</button>
      <button onClick={props.onEditScore}>Edit</button>
    </div>
  ),
}));

jest.mock("@/components/scoring/SetupModal", () => ({
  SetupModal: () => <div data-testid="setup-modal" />,
}));

jest.mock("@/components/scoring/UndoConfirmModal", () => ({
  UndoConfirmModal: () => <div data-testid="undo-modal" />,
}));

jest.mock("@/components/scoring/PointDetailsModal", () => ({
  PointDetailsModal: () => <div data-testid="point-details-modal" />,
}));

jest.mock("@/components/scoring/ServerEffectModal", () => ({
  ServerEffectModal: () => <div data-testid="server-effect-modal" />,
}));

jest.mock("@/components/scoring/EditScoreModal", () => ({
  EditScoreModal: () => <div data-testid="edit-score-modal" />,
}));

jest.mock("@/components/scoring/MatchTimelineView", () => ({
  MatchTimelineView: () => <div data-testid="timeline-view" />,
}));

jest.mock("@/components/scoring/CourtBackground", () => ({
  __esModule: true,
  default: () => <div data-testid="court-background" />,
}));

jest.mock("@/components/scoring/AnnotationSessionPanel", () => ({
  AnnotationSessionPanel: () => <div data-testid="annotation-session-panel" />,
}));

const mockMatchData = {
  id: "test-match-id",
  format: "BEST_OF_3",
  player1: { id: "p1", name: "Player 1" },
  player2: { id: "p2", name: "Player 2" },
  initialServerId: "p1",
  scoreState: {
    sets: [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
    ],
    currentGame: { player1: 30, player2: 15, isDeuce: false, advantage: null, secondServe: false },
    server: "player1",
    setsWon: { player1: 1, player2: 0 },
    isFinished: false,
    winner: null,
    startedAt: Date.now(),
    secondServe: false,
  },
  state: "IN_PROGRESS",
  sportType: "TENNIS",
  courtType: "CLAY",
  version: 1,
  _count: { pointLog: 10 },
};

const mockMatchDataFinished = {
  ...mockMatchData,
  scoreState: {
    ...mockMatchData.scoreState,
    sets: [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null },
    ],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: "player1",
    setsWon: { player1: 2, player2: 0 },
    isFinished: true,
    winner: "player1",
    startedAt: Date.now(),
    secondServe: false,
  },
};

const mockMatchDataNoInitialServer = {
  ...mockMatchData,
  initialServerId: undefined,
  scoreState: undefined,
};

const mockFetchMatchSuccess = () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockMatchData),
      status: 200,
      headers: new Map(),
    } as unknown as Response)
  ) as jest.Mock;
};

const mockFetchMatchNoInitialServer = () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockMatchDataNoInitialServer),
      status: 200,
      headers: new Map(),
    } as unknown as Response)
  ) as jest.Mock;
};

const mockFetchMatchError = () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Erro ao carregar partida" }),
      headers: new Map(),
    } as unknown as Response)
  ) as jest.Mock;
};

const mockFetchMatchFinished = () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockMatchDataFinished),
      status: 200,
      headers: new Map(),
    } as unknown as Response)
  ) as jest.Mock;
};

describe("ScoringPage - Characterization Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockModalStack = {
      activeModal: null,
      modalParams: {},
      open: jest.fn(),
      close: jest.fn(),
      closeAll: jest.fn(),
      replace: jest.fn(),
    };
  });

  describe("Loading state", () => {
    it("deve exibir spinner enquanto carrega a partida", async () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

      render(<ScoringPage />);

      expect(document.querySelector(".animate-spin")).toBeTruthy();
    });
  });

  describe("Error state", () => {
    it("deve exibir mensagem de erro quando falha ao carregar", async () => {
      mockFetchMatchError();

      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByText("Erro ao carregar partida")).toBeInTheDocument();
      });
    });
  });

  describe("Normal scoring view", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve renderizar header, scoreboard e action bar após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("match-header")).toBeInTheDocument();
        expect(screen.getByTestId("scoreboard-card")).toBeInTheDocument();
        expect(screen.getByTestId("action-bar")).toBeInTheDocument();
      });
    });

    it("deve renderizar player cards com nomes corretos após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("player-card-player1")).toHaveTextContent("Player 1");
        expect(screen.getByTestId("player-card-player2")).toHaveTextContent("Player 2");
      });
    });

    it("deve exibir botões de undo e redo na ActionBar após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByText("Undo")).toBeInTheDocument();
        expect(screen.getByText("Redo")).toBeInTheDocument();
      });
    });

    it("deve exibir controles de fonte (A-/A+) após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByText("A−")).toBeInTheDocument();
        expect(screen.getByText("A+")).toBeInTheDocument();
      });
    });

    it("deve exibir botão de editar placar após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });
    });
  });

  describe("Timeline view", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve exibir view de timeline quando viewMode='timeline'", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("match-header")).toBeInTheDocument();
      });

      const timelineButton = screen.getByText("Timeline");
      timelineButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("timeline-view")).toBeInTheDocument();
      });
    });
  });

  describe("Finished match banner", () => {
    beforeEach(() => {
      mockFetchMatchFinished();
    });

    it("deve exibir banner de partida finalizada quando isFinished=true", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByText("PARTIDA FINALIZADA!")).toBeInTheDocument();
      });
    });

    it("deve exibir botões de relatório e registrar no banner", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByText(/Relatório/)).toBeInTheDocument();
        expect(screen.getByText(/Registrar/)).toBeInTheDocument();
      });
    });
  });

  describe("Sync status", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve exibir indicador de sync status", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        const syncStatus = screen.getByTestId("sync-status");
        expect(syncStatus).toBeInTheDocument();
      });
    });
  });

  describe("Modals", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve exibir SetupModal quando activeModal='setup' e não há initialServerId", async () => {
      mockFetchMatchNoInitialServer();
      mockModalStack = {
        activeModal: "setup",
        modalParams: {},
        open: jest.fn(),
        close: jest.fn(),
        closeAll: jest.fn(),
        replace: jest.fn(),
      };

      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("setup-modal")).toBeInTheDocument();
      });
    });

    it("deve exibir UndoConfirmModal quando activeModal='undo'", async () => {
      mockModalStack = {
        activeModal: "undo",
        modalParams: {},
        open: jest.fn(),
        close: jest.fn(),
        closeAll: jest.fn(),
        replace: jest.fn(),
      };

      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("undo-modal")).toBeInTheDocument();
      });
    });

    it("deve exibir EditScoreModal quando activeModal='edit-score'", async () => {
      mockModalStack = {
        activeModal: "edit-score",
        modalParams: {},
        open: jest.fn(),
        close: jest.fn(),
        closeAll: jest.fn(),
        replace: jest.fn(),
      };

      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("edit-score-modal")).toBeInTheDocument();
      });
    });

    it("deve exibir PointDetailsModal quando activeModal='point-details'", async () => {
      mockModalStack = {
        activeModal: "point-details",
        modalParams: {},
        open: jest.fn(),
        close: jest.fn(),
        closeAll: jest.fn(),
        replace: jest.fn(),
      };

      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("point-details-modal")).toBeInTheDocument();
      });
    });

    it("deve exibir ServerEffectModal quando activeModal='serve-effect'", async () => {
      mockModalStack = {
        activeModal: "serve-effect",
        modalParams: {},
        open: jest.fn(),
        close: jest.fn(),
        closeAll: jest.fn(),
        replace: jest.fn(),
      };

      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("server-effect-modal")).toBeInTheDocument();
      });
    });
  });

  describe("ActionBar props", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve renderizar ActionBar após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        const actionBar = screen.getByTestId("action-bar");
        expect(actionBar).toBeInTheDocument();
      });
    });
  });

  describe("Font scaling", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve ter controles de fonte funcionais após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        const smallerButton = screen.getByText("A−");
        const biggerButton = screen.getByText("A+");

        expect(smallerButton).toBeInTheDocument();
        expect(biggerButton).toBeInTheDocument();
      });
    });
  });

  describe("Offline sync status", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve exibir status de sync após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        const syncStatus = screen.getByTestId("sync-status");
        expect(syncStatus).toBeInTheDocument();
      });
    });
  });

  describe("AnnotationSessionPanel", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("não deve exibir AnnotationSessionPanel quando não há sessão ativa", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("annotation-session-panel")).not.toBeInTheDocument();
      });
    });
  });

  describe("Match point badges", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve exibir ContextBadges após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        expect(screen.getByTestId("context-badges")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    beforeEach(() => {
      mockFetchMatchSuccess();
    });

    it("deve ter botão para voltar ao dashboard após carregar", async () => {
      render(<ScoringPage />);

      await waitFor(() => {
        const closeButton = screen.getByText("Close");
        expect(closeButton).toBeInTheDocument();
      });
    });
  });
});
