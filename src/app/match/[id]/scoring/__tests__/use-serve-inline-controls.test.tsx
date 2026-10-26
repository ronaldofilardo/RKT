/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { useServeInlineControls } from '../use-serve-inline-controls';

type Hook = Parameters<typeof useServeInlineControls>;

function makeHandlers() {
  return {
    recordAceDirectly: jest.fn(),
    recordDirectServeError: jest.fn(),
    startServeErrorDetails: jest.fn(),
    dismissServeErrorDetails: jest.fn(),
    confirmServerEffect: jest.fn(),
    confirmServeError: jest.fn(),
    cancelServeError: jest.fn(),
  };
}

function setup(initial: { step?: 'none' | 'second'; points?: number; modal?: string | null; finished?: boolean; processing?: boolean } = {}) {
  const handlers = makeHandlers();
  const build = (o: typeof initial) => [
    { serveErrorState: { serveStep: o.step ?? 'none' }, pointsHistory: new Array(o.points ?? 0).fill('p'), activeModal: o.modal ?? null },
    handlers,
    { isFinished: o.finished ?? false, isProcessingPoint: o.processing ?? false, p1IsServing: true },
  ] as unknown as Hook;
  const view = renderHook((o: typeof initial) => useServeInlineControls(...build(o)), { initialProps: initial });
  return { ...view, handlers };
}

const toggleOn = (r: ReturnType<typeof setup>, which: 'options.onAceDetailsToggle' | 'options.onDfDetailsToggle') =>
  act(() => (which === 'options.onAceDetailsToggle' ? r.result.current.options.onAceDetailsToggle() : r.result.current.options.onDfDetailsToggle()));

describe('useServeInlineControls — Ace', () => {
  it('sem "Detalhes do ACE" registra direto e não abre painel', () => {
    const r = setup();
    act(() => r.result.current.controls.onAction('ace'));

    expect(r.handlers.recordAceDirectly).toHaveBeenCalledTimes(1);
    expect(r.result.current.controls.openAction).toBeNull();
  });

  it('com "Detalhes do ACE" abre o painel e só registra ao confirmar', () => {
    const r = setup();
    toggleOn(r, 'options.onAceDetailsToggle');
    act(() => r.result.current.controls.onAction('ace'));

    expect(r.result.current.controls.openAction).toBe('ace');
    expect(r.handlers.recordAceDirectly).not.toHaveBeenCalled();

    act(() => r.result.current.controls.onConfirm('flat', 'centro'));

    expect(r.handlers.confirmServerEffect).toHaveBeenCalledWith('flat', 'centro');
    expect(r.result.current.controls.openAction).toBeNull();
  });

  it('cancelar o painel do Ace não mexe no estado de erro de saque', () => {
    const r = setup();
    toggleOn(r, 'options.onAceDetailsToggle');
    act(() => r.result.current.controls.onAction('ace'));
    act(() => r.result.current.controls.onCancel());

    expect(r.result.current.controls.openAction).toBeNull();
    expect(r.handlers.dismissServeErrorDetails).not.toHaveBeenCalled();
    expect(r.handlers.cancelServeError).not.toHaveBeenCalled();
  });
});

describe('useServeInlineControls — Out / Net (Detalhes da DF)', () => {
  it.each(['out', 'net'] as const)('%s sem "Detalhes da DF" registra direto no 1º saque', (action) => {
    const r = setup();
    act(() => r.result.current.controls.onAction(action));

    expect(r.handlers.recordDirectServeError).toHaveBeenCalledWith(action, 'first');
    expect(r.handlers.startServeErrorDetails).not.toHaveBeenCalled();
    expect(r.result.current.controls.openAction).toBeNull();
  });

  it.each([
    ['out', 'none', 'first'],
    ['net', 'none', 'first'],
    ['out', 'second', 'second'],
    ['net', 'second', 'second'],
  ] as const)('%s com "Detalhes da DF" (serveStep=%s) abre o painel no passo %s e confirma pelo handler de erro', (action, serveStep, step) => {
    const r = setup({ step: serveStep });
    toggleOn(r, 'options.onDfDetailsToggle');
    act(() => r.result.current.controls.onAction(action));

    expect(r.handlers.startServeErrorDetails).toHaveBeenCalledWith(action, step);
    expect(r.result.current.controls.openAction).toBe(action);
    expect(r.result.current.controls.step).toBe(step);

    act(() => r.result.current.controls.onConfirm('slice', 'aberto'));

    expect(r.handlers.confirmServeError).toHaveBeenCalledWith('slice', 'aberto');
    expect(r.handlers.confirmServerEffect).not.toHaveBeenCalled();
    expect(r.result.current.controls.openAction).toBeNull();
  });

  it('cancelar só fecha o painel: não zera o 1º saque (cancelServeError não é chamado)', () => {
    const r = setup({ step: 'second' });
    toggleOn(r, 'options.onDfDetailsToggle');
    act(() => r.result.current.controls.onAction('out'));
    act(() => r.result.current.controls.onCancel());

    expect(r.handlers.dismissServeErrorDetails).toHaveBeenCalledTimes(1);
    expect(r.handlers.cancelServeError).not.toHaveBeenCalled();
    expect(r.result.current.controls.openAction).toBeNull();
  });

  it('clicar de novo no mesmo botão recolhe o painel', () => {
    const r = setup();
    toggleOn(r, 'options.onDfDetailsToggle');
    act(() => r.result.current.controls.onAction('net'));
    act(() => r.result.current.controls.onAction('net'));

    expect(r.result.current.controls.openAction).toBeNull();
    expect(r.handlers.dismissServeErrorDetails).toHaveBeenCalledTimes(1);
  });

  it('trocar de Out para Net reaponta o erro pendente e mantém um único painel', () => {
    const r = setup();
    toggleOn(r, 'options.onDfDetailsToggle');
    act(() => r.result.current.controls.onAction('out'));
    act(() => r.result.current.controls.onAction('net'));

    expect(r.handlers.startServeErrorDetails).toHaveBeenLastCalledWith('net', 'first');
    expect(r.result.current.controls.openAction).toBe('net');
  });

  it('trocar de Out para Ace limpa o erro pendente antes de abrir o painel do Ace', () => {
    const r = setup();
    toggleOn(r, 'options.onDfDetailsToggle');
    toggleOn(r, 'options.onAceDetailsToggle');
    act(() => r.result.current.controls.onAction('out'));
    act(() => r.result.current.controls.onAction('ace'));

    expect(r.handlers.dismissServeErrorDetails).toHaveBeenCalledTimes(1);
    expect(r.result.current.controls.openAction).toBe('ace');
  });
});

describe('useServeInlineControls — bloqueios e fechamento automático', () => {
  it.each([{ finished: true }, { processing: true }])('ignora cliques quando %o', (flags) => {
    const r = setup(flags);
    act(() => r.result.current.controls.onAction('ace'));
    act(() => r.result.current.controls.onAction('out'));

    expect(r.handlers.recordAceDirectly).not.toHaveBeenCalled();
    expect(r.handlers.recordDirectServeError).not.toHaveBeenCalled();
    expect(r.result.current.controls.disabled).toBe(true);
  });

  it('desmarcar um checkbox com painel aberto fecha o painel', () => {
    const r = setup();
    toggleOn(r, 'options.onAceDetailsToggle');
    act(() => r.result.current.controls.onAction('ace'));
    toggleOn(r, 'options.onAceDetailsToggle');

    expect(r.result.current.controls.openAction).toBeNull();
    expect(r.result.current.options.aceDetailsEnabled).toBe(false);
  });

  it('fecha o painel quando um ponto é registrado por outro caminho', () => {
    const r = setup({ points: 3 });
    toggleOn(r, 'options.onDfDetailsToggle');
    act(() => r.result.current.controls.onAction('out'));
    expect(r.result.current.controls.openAction).toBe('out');

    r.rerender({ points: 4 });

    expect(r.result.current.controls.openAction).toBeNull();
    expect(r.handlers.dismissServeErrorDetails).toHaveBeenCalled();
  });

  it('fecha o painel quando outro modal abre (ex.: detalhes do ponto)', () => {
    const r = setup();
    toggleOn(r, 'options.onAceDetailsToggle');
    act(() => r.result.current.controls.onAction('ace'));

    r.rerender({ modal: 'point-details' });

    expect(r.result.current.controls.openAction).toBeNull();
  });

  it('mantém o painel aberto quando nada relevante muda', () => {
    const r = setup({ points: 2 });
    toggleOn(r, 'options.onAceDetailsToggle');
    act(() => r.result.current.controls.onAction('ace'));

    r.rerender({ points: 2 });

    expect(r.result.current.controls.openAction).toBe('ace');
  });
});
