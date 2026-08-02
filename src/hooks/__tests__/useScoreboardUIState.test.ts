import { scoreboardReducer, ScoreboardUIState } from '../useScoreboardUIState';

const initialState: ScoreboardUIState = {
  serveStep: 'none',
  firstServeError: null,
  pendingServeError: null,
  pendingDoubleFault: false,
  serveErrorStage: null,
  isServeErrorModalOpen: false,
};

describe('useScoreboardUIState reducer', () => {
  describe('FIRST_SERVE_ERROR_SET', () => {
    it('deve definir firstServeError E serveStep=second em uma única atualização', () => {
      const action = {
        type: 'FIRST_SERVE_ERROR_SET' as const,
        err: { errorType: 'out' as const, serveEffect: 'topspin', direction: 'aberto' as const },
      };
      const newState = scoreboardReducer(initialState, action);

      expect(newState.firstServeError).toEqual({
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      });
      expect(newState.serveStep).toBe('second');
    });

    it('deve fechar o modal e limpar pendingServeError ao definir primeiro erro', () => {
      const stateWithPending = {
        ...initialState,
        pendingServeError: { errorType: 'net' as const, serveStep: 'first' as const },
        serveErrorStage: 'first' as const,
        isServeErrorModalOpen: true,
        pendingDoubleFault: false,
      };
      const action = {
        type: 'FIRST_SERVE_ERROR_SET' as const,
        err: { errorType: 'net' as const },
      };
      const newState = scoreboardReducer(stateWithPending, action);

      expect(newState.pendingServeError).toBeNull();
      expect(newState.isServeErrorModalOpen).toBe(false);
      expect(newState.serveErrorStage).toBeNull();
      expect(newState.pendingDoubleFault).toBe(false);
      expect(newState.firstServeError).toEqual({ errorType: 'net' });
    });

    it('deve preservar firstServeError quando serveStep avança para second', () => {
      const action = {
        type: 'FIRST_SERVE_ERROR_SET' as const,
        err: { errorType: 'out' as const, serveEffect: 'slice', direction: 'fechado' },
      };
      const newState = scoreboardReducer(initialState, action);

      expect(newState.firstServeError).not.toBeNull();
      expect(newState.firstServeError).toEqual({ errorType: 'out', serveEffect: 'slice', direction: 'fechado' });
      expect(newState.serveStep).toBe('second');
      expect(newState.pendingServeError).toBeNull();
    });
  });

  describe('FIRST_SERVE_ERROR_CLEAR', () => {
    it('deve limpar firstServeError e resetar serveStep para none', () => {
      const stateWithError: ScoreboardUIState = {
        ...initialState,
        firstServeError: { errorType: 'out' as const, serveEffect: 'topspin', direction: 'aberto' },
        serveStep: 'second',
      };
      const action = { type: 'FIRST_SERVE_ERROR_CLEAR' as const };
      const newState = scoreboardReducer(stateWithError, action);

      expect(newState.firstServeError).toBeNull();
      expect(newState.serveStep).toBe('none');
    });

    it('deve fechar modal ao limpar', () => {
      const stateWithError: ScoreboardUIState = {
        ...initialState,
        firstServeError: { errorType: 'net' as const },
        serveStep: 'second',
        isServeErrorModalOpen: false,
        pendingServeError: null,
        serveErrorStage: 'second',
        pendingDoubleFault: true,
      };
      const action = { type: 'FIRST_SERVE_ERROR_CLEAR' as const };
      const newState = scoreboardReducer(stateWithError, action);

      expect(newState.isServeErrorModalOpen).toBe(false);
      expect(newState.pendingServeError).toBeNull();
      expect(newState.serveErrorStage).toBeNull();
      expect(newState.pendingDoubleFault).toBe(false);
    });
  });

  describe('SERVE_ERROR_OPEN', () => {
    it('deve definir pendingServeError e abrir modal com pendingDoubleFault=true para segundo saque', () => {
      const action = {
        type: 'SERVE_ERROR_OPEN' as const,
        error: { errorType: 'out' as const, serveStep: 'second' as const },
      };
      const newState = scoreboardReducer(initialState, action);

      expect(newState.pendingServeError).toEqual({ errorType: 'out', serveStep: 'second' });
      expect(newState.serveErrorStage).toBe('second');
      expect(newState.isServeErrorModalOpen).toBe(true);
      expect(newState.pendingDoubleFault).toBe(true);
    });

    it('deve definir pendingDoubleFault=false para primeiro saque', () => {
      const action = {
        type: 'SERVE_ERROR_OPEN' as const,
        error: { errorType: 'net' as const, serveStep: 'first' as const },
      };
      const newState = scoreboardReducer(initialState, action);

      expect(newState.pendingServeError).toEqual({ errorType: 'net', serveStep: 'first' });
      expect(newState.serveErrorStage).toBe('first');
      expect(newState.isServeErrorModalOpen).toBe(true);
      expect(newState.pendingDoubleFault).toBe(false);
    });
  });

  describe('SERVE_ERROR_CLOSE', () => {
    it('deve fechar modal sem limpar firstServeError', () => {
      const stateWithError: ScoreboardUIState = {
        ...initialState,
        firstServeError: { errorType: 'out' as const },
        serveStep: 'second',
        pendingServeError: { errorType: 'out' as const, serveStep: 'first' as const },
        isServeErrorModalOpen: true,
        pendingDoubleFault: false,
        serveErrorStage: 'first',
      };
      const action = { type: 'SERVE_ERROR_CLOSE' as const };
      const newState = scoreboardReducer(stateWithError, action);

      expect(newState.isServeErrorModalOpen).toBe(false);
      expect(newState.pendingServeError).toBeNull();
      expect(newState.serveErrorStage).toBeNull();
      expect(newState.pendingDoubleFault).toBe(false);
      expect(newState.firstServeError).toEqual({ errorType: 'out' });
      expect(newState.serveStep).toBe('second');
    });
  });

  describe('SET_SERVE_STEP', () => {
    it('deve atualizar serveStep para second', () => {
      const action = { type: 'SET_SERVE_STEP' as const, step: 'second' as const };
      const newState = scoreboardReducer(initialState, action);
      expect(newState.serveStep).toBe('second');
    });

    it('deve atualizar serveStep para none', () => {
      const stateWithSecond = { ...initialState, serveStep: 'second' as const };
      const action = { type: 'SET_SERVE_STEP' as const, step: 'none' as const };
      const newState = scoreboardReducer(stateWithSecond, action);
      expect(newState.serveStep).toBe('none');
    });
  });
});