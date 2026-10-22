/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) pré-corte #10: deduplicar firstFaultDetail/isSecond.
 * Congela early-returns, ACE1ª/2ª, first→second do erro, double fault e cancelamento.
 */

import { createServeActionsService } from '../useScoringHandlers.serve-actions.service';

jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), log: jest.fn() } }));

type Deps = Parameters<typeof createServeActionsService>[0];
const ok = () => undefined;

function makeService(overrides: Partial<Deps> = {}) {
  const deps = {
    match: { id: 'm1' }, serveErrorState: { serveStep: 'none', firstServeError: null, pendingServeError: null },
    serverHelpers: { getServerId: () => 's1', getWinnerId: (w: boolean) => (w ? 'p1' : 'p2') },
    modalService: { createAceRallyDetails: jest.fn(() => ({ kind: 'ace' })), createDoubleFaultRallyDetails: jest.fn(() => ({ kind: 'df' })) },
    applyPoint: jest.fn(async () => ok()), engineRef: { current: {} }, isProcessingRef: { current: false },
    debounceTimerRef: { current: null } as { current: NodeJS.Timeout | null },
    closeAll: jest.fn(), setFirstServeError: jest.fn(), clearFirstServeError: jest.fn(),
    openServeErrorModal: jest.fn(), closeServeErrorModal: jest.fn(), setServeStep: jest.fn(),
    ...overrides,
  } as Deps;
  return { service: createServeActionsService(deps), deps };
}

describe('createServeActionsService — characterization (pré-corte #10)', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('early-return sem match ou com isProcessing não chama applyPoint', () => {
    const a = makeService({ match: null });
    a.service.recordAceDirectly(); a.service.confirmServerEffect();
    const b = makeService({ isProcessingRef: { current: true } });
    b.service.recordDirectServeError('out', 'second');
    expect(a.deps.applyPoint).not.toHaveBeenCalled();
    expect(b.deps.applyPoint).not.toHaveBeenCalled();
  });

  it('recordAceDirectly: após debounce, ACE de primeira e limpa estado', async () => {
    const { service, deps } = makeService();
    service.recordAceDirectly();
    expect(deps.applyPoint).not.toHaveBeenCalled();
    await jest.runAllTimersAsync();
    expect(deps.applyPoint).toHaveBeenCalledWith(expect.objectContaining(
      { type: 'ACE', winnerId: 'p1', serverId: 's1', isFirstServe: true, isSecondServe: false }));
    expect(deps.clearFirstServeError).toHaveBeenCalled();
    expect(deps.setServeStep).toHaveBeenCalledWith('none');
  });

  it('recordAceDirectly com firstServeError vira segunda com firstFaultDetail', () => {
    const { service, deps } = makeService({
      serveErrorState: { serveStep: 'second', firstServeError: { errorType: 'net', serveEffect: 'wide', direction: 'left' }, pendingServeError: null },
    });
    service.recordAceDirectly();
    jest.runAllTimers();
    expect(deps.applyPoint).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ACE', isFirstServe: false, isSecondServe: true,
      firstFaultDetail: { errorType: 'net', serveEffect: 'wide', direction: 'left' },
    }));
  });

  it('confirmServeError no 1º saque grava firstServeError e vai a second sem applyPoint', () => {
    const { service, deps } = makeService({
      serveErrorState: { serveStep: 'first', firstServeError: null, pendingServeError: { errorType: 'out', serveStep: 'first' } },
    });
    service.confirmServeError('body', 'middle');
    expect(deps.setFirstServeError).toHaveBeenCalledWith({ errorType: 'out', serveEffect: 'body', direction: 'middle' });
    expect(deps.setServeStep).toHaveBeenCalledWith('second');
    expect(deps.applyPoint).not.toHaveBeenCalled();
  });

  it('confirmServeError no 2º saque aplica DOUBLE_FAULT após 50ms', () => {
    const { service, deps } = makeService({
      serveErrorState: { serveStep: 'second', firstServeError: null, pendingServeError: { errorType: 'net', serveStep: 'second' } },
    });
    service.confirmServeError();
    jest.runAllTimers();
    expect(deps.modalService.createDoubleFaultRallyDetails).toHaveBeenCalledWith('net', undefined, undefined);
    expect(deps.applyPoint).toHaveBeenCalledWith(expect.objectContaining(
      { type: 'DOUBLE_FAULT', winnerId: 'p2', isFirstServe: false, isSecondServe: true }));
  });

  it('recordDirectServeError(first) abre modal, grava firstServeError e não aplica ponto', () => {
    const { service, deps } = makeService();
    service.recordDirectServeError('out', 'first');
    expect(deps.openServeErrorModal).toHaveBeenCalledWith('out', 'first');
    expect(deps.setFirstServeError).toHaveBeenCalled();
    expect(deps.setServeStep).toHaveBeenCalledWith('second');
    expect(deps.applyPoint).not.toHaveBeenCalled();
  });
});
