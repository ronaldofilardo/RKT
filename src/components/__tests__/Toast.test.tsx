/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';
import type { ToastOptions } from '../toast-types';

let emitToast: (options: ToastOptions) => string = () => '';

function Trigger() {
  const { toast } = useToast();
  emitToast = toast;
  return <button type="button">gatilho</button>;
}

function renderToasts() {
  return render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
}

function emit(options: ToastOptions) {
  let id = '';
  act(() => {
    id = emitToast(options);
  });
  return id;
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza o toast com tipo e mensagem', () => {
    renderToasts();
    emit({ type: 'success', message: 'Partida salva' });

    const toast = screen.getByTestId('toast');
    expect(toast).toHaveAttribute('data-toast-type', 'success');
    expect(toast).toHaveTextContent('Partida salva');
    expect(toast).toHaveAttribute('role', 'status');
  });

  it('usa role="alert" para erro e warning', () => {
    renderToasts();
    emit({ type: 'warning', message: 'Conexão instável', persistent: true });

    expect(screen.getByTestId('toast')).toHaveAttribute('role', 'alert');
    expect(screen.getByTestId('toast')).toHaveAttribute('aria-live', 'assertive');
  });

  it('fecha sozinho após 5s por padrão', () => {
    renderToasts();
    emit({ type: 'info', message: 'Sincronizando' });

    advance(4999);
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('respeita durationMs customizado', () => {
    renderToasts();
    emit({ type: 'success', message: 'Copiado', durationMs: 1000 });

    advance(999);
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('persistent não fecha sozinho', () => {
    renderToasts();
    emit({ type: 'error', message: 'Falha crítica', persistent: true });

    advance(60000);
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('loading não fecha sozinho e exibe spinner', () => {
    renderToasts();
    emit({ type: 'loading', message: 'Enviando...' });

    advance(60000);
    expect(screen.getByTestId('toast')).toHaveAttribute('data-toast-type', 'loading');
    expect(screen.getByTestId('toast').querySelector('svg.animate-spin')).not.toBeNull();
  });

  it('desduplica por key atualizando o conteúdo e reiniciando o timer', () => {
    renderToasts();
    emit({ type: 'error', message: 'Sem conexão', key: 'offline-sync' });
    advance(3000);
    emit({ type: 'error', message: 'Sem conexão (2ª tentativa)', key: 'offline-sync' });

    expect(screen.getAllByTestId('toast')).toHaveLength(1);
    expect(screen.getByTestId('toast')).toHaveTextContent('Sem conexão (2ª tentativa)');

    advance(3000);
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    advance(2000);
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('dispara a ação inline e fecha o toast', () => {
    const onClick = jest.fn();
    renderToasts();
    emit({
      type: 'error',
      message: 'Falha ao salvar',
      persistent: true,
      action: { label: 'Tentar novamente', onClick },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('fecha pelo botão acessível', () => {
    renderToasts();
    emit({ type: 'error', message: 'Falha crítica', persistent: true });

    fireEvent.click(screen.getByRole('button', { name: 'Fechar notificação' }));
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('posiciona no rodapé no mobile e no topo à direita no desktop', () => {
    renderToasts();
    const container = screen.getByTestId('toast-container');

    expect(container.className).toContain('bottom-4');
    expect(container.className).toContain('inset-x-4');
    expect(container.className).toContain('sm:top-4');
    expect(container.className).toContain('sm:right-4');
    expect(container.className).toContain('sm:bottom-auto');
  });
});
