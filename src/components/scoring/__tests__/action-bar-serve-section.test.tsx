/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ServeSection } from '@/components/scoring/action-bar-serve-section';

function renderSection(overrides: Partial<React.ComponentProps<typeof ServeSection>> = {}) {
  const handlers = { onAce: jest.fn(), onOut: jest.fn(), onNet: jest.fn() };
  render(
    <ServeSection
      aceDetailsEnabled={false}
      onAceDetailsToggle={() => undefined}
      dfDetailsEnabled={false}
      onDfDetailsToggle={() => undefined}
      showSecondBadge={false}
      disabled={false}
      step="none"
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe('ServeSection — botões Ace / Out / Net', () => {
  it('possuem tamanho ergonômico touch e cantos rounded-xl nos três botões', () => {
    renderSection();

    for (const name of ['Ace', 'Out', 'Net']) {
      const btn = screen.getByRole('button', { name });
      expect(btn).toHaveClass('min-h-[52px]');
      expect(btn).toHaveClass('rounded-xl');
    }
  });

  it('têm acentos luminescentes no padrão Broadcast Telemetry', () => {
    renderSection();

    expect(screen.getByRole('button', { name: 'Ace' })).toHaveClass('text-telemetry-volt');
    expect(screen.getByRole('button', { name: 'Out' })).toHaveClass('text-red-400');
    expect(screen.getByRole('button', { name: 'Net' })).toHaveClass('text-slate-200');
    expect(screen.queryByText('Dupla falta')).not.toBeInTheDocument();
  });

  it('no 2º saque Out e Net viram "Dupla falta": destaque com subrótulo e nome acessível preservado', () => {
    renderSection({ step: 'second', showSecondBadge: true });

    const out = screen.getByRole('button', { name: 'Out' });
    const net = screen.getByRole('button', { name: 'Net' });
    expect(out).toHaveClass('bg-telemetry-error/20');
    expect(net).toHaveClass('bg-telemetry-error/20');
    expect(screen.getAllByText('Dupla falta')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Ace' })).toHaveClass('text-telemetry-volt');
  });

  it('continua enviando o passo correto ao clicar (first / second)', () => {
    const first = renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Out' }));
    fireEvent.click(screen.getByRole('button', { name: 'Net' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ace' }));
    expect(first.onOut).toHaveBeenCalledWith('first');
    expect(first.onNet).toHaveBeenCalledWith('first');
    expect(first.onAce).toHaveBeenCalledTimes(1);
  });

  it('envia "second" no 2º saque', () => {
    const second = renderSection({ step: 'second' });

    fireEvent.click(screen.getByRole('button', { name: 'Out' }));
    fireEvent.click(screen.getByRole('button', { name: 'Net' }));

    expect(second.onOut).toHaveBeenCalledWith('second');
    expect(second.onNet).toHaveBeenCalledWith('second');
  });

  it('desabilita os três botões quando disabled', () => {
    renderSection({ disabled: true });

    for (const name of ['Ace', 'Out', 'Net']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });
});
