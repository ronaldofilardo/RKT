/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ServeActionButtons } from '@/components/scoring/ServeActionButtons';

function renderButtons(overrides: Partial<React.ComponentProps<typeof ServeActionButtons>> = {}) {
  const onAction = jest.fn();
  render(
    <ServeActionButtons step="first" disabled={false} processing={false} openAction={null} onAction={onAction} {...overrides} />,
  );
  return onAction;
}

describe('ServeActionButtons — Ace / Out / Net sob o card do sacador', () => {
  it('altura adaptativa (clamp em dvh) e cantos rounded-xl nos três botões', () => {
    renderButtons();

    for (const name of ['Ace', 'Out', 'Net']) {
      const btn = screen.getByRole('button', { name });
      expect(btn).toHaveClass('min-h-[clamp(40px,6dvh,56px)]');
      expect(btn).toHaveClass('rounded-xl');
    }
  });

  it('têm acentos luminescentes no padrão Broadcast Telemetry', () => {
    renderButtons();

    expect(screen.getByRole('button', { name: 'Ace' })).toHaveClass('text-telemetry-volt');
    expect(screen.getByRole('button', { name: 'Out' })).toHaveClass('text-red-400');
    expect(screen.getByRole('button', { name: 'Net' })).toHaveClass('text-slate-200');
    expect(screen.queryByText('Dupla falta')).not.toBeInTheDocument();
  });

  it('no 2º saque Out e Net viram "Dupla falta" com nome acessível preservado', () => {
    renderButtons({ step: 'second' });

    expect(screen.getByRole('button', { name: 'Out' })).toHaveClass('bg-telemetry-error/20');
    expect(screen.getByRole('button', { name: 'Net' })).toHaveClass('bg-telemetry-error/20');
    expect(screen.getAllByText('Dupla falta')).toHaveLength(2);
  });

  it('envia a ação clicada', () => {
    const onAction = renderButtons();

    fireEvent.click(screen.getByRole('button', { name: 'Ace' }));
    fireEvent.click(screen.getByRole('button', { name: 'Out' }));
    fireEvent.click(screen.getByRole('button', { name: 'Net' }));

    expect(onAction.mock.calls.map(([a]) => a)).toEqual(['ace', 'out', 'net']);
  });

  it('marca como pressionado apenas o botão com painel aberto', () => {
    renderButtons({ openAction: 'out' });

    expect(screen.getByRole('button', { name: 'Out' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ace' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Net' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('desabilita os três botões quando disabled', () => {
    renderButtons({ disabled: true });

    for (const name of ['Ace', 'Out', 'Net']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });

  it('mostra ⏳ enquanto processa', () => {
    renderButtons({ processing: true });
    expect(screen.getAllByText('⏳')).toHaveLength(3);
  });
});
