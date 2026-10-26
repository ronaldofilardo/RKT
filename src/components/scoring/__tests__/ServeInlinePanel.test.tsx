/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ServeInlinePanel } from '@/components/scoring/ServeInlinePanel';

function renderPanel(overrides: Partial<React.ComponentProps<typeof ServeInlinePanel>> = {}) {
  const handlers = { onConfirm: jest.fn(), onCancel: jest.fn() };
  render(<ServeInlinePanel action="ace" step="first" disabled={false} {...handlers} {...overrides} />);
  return handlers;
}

describe('ServeInlinePanel — detalhes inline (substitui o ServerEffectModal)', () => {
  it('renderiza efeito, direção, confirmar e cancelar sem overlay/dialog modal', () => {
    renderPanel();

    for (const name of ['TopSpin', 'Slice', 'Flat', 'Aberto', 'Centro', 'Fechado', 'Confirmar Ponto', 'Cancelar']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Detalhes do ace' })).toBeInTheDocument();
  });

  it('Ace: confirma com efeito e direção escolhidos', () => {
    const { onConfirm } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Flat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Centro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Ponto' }));

    expect(onConfirm).toHaveBeenCalledWith('flat', 'centro');
  });

  it('confirma sem escolhas enviando undefined (efeito e direção são opcionais)', () => {
    const { onConfirm } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Ponto' }));

    expect(onConfirm).toHaveBeenCalledWith(undefined, undefined);
  });

  it.each([
    ['out', 'first', 'Registrar e Continuar'],
    ['net', 'first', 'Registrar e Continuar'],
    ['out', 'second', 'Registrar Dupla Falta'],
    ['net', 'second', 'Registrar Dupla Falta'],
  ] as const)('%s no %s saque usa o rótulo "%s" e rótulos de falha', (action, step, label) => {
    renderPanel({ action, step });

    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    expect(screen.getByText('Efeito da Falha (opcional)')).toBeInTheDocument();
    expect(screen.getByText('Direção da Falha (opcional)')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Detalhes do erro de saque' })).toBeInTheDocument();
  });

  it('Cancelar chama onCancel sem confirmar', () => {
    const { onConfirm, onCancel } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('desabilita Confirmar quando disabled (ponto em processamento)', () => {
    renderPanel({ disabled: true });
    expect(screen.getByRole('button', { name: 'Confirmar Ponto' })).toBeDisabled();
  });

  it('alternar a seleção mantém um único efeito marcado', () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Slice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Flat' }));

    expect(screen.getByRole('button', { name: 'Slice' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Flat' })).toHaveAttribute('aria-pressed', 'true');
  });
});
