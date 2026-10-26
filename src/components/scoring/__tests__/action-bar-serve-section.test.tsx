/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ServeSection } from '@/components/scoring/action-bar-serve-section';

function renderSection(overrides: Partial<React.ComponentProps<typeof ServeSection>> = {}) {
  const handlers = { onAceDetailsToggle: jest.fn(), onDfDetailsToggle: jest.fn() };
  render(
    <ServeSection
      aceDetailsEnabled={false}
      dfDetailsEnabled={false}
      showSecondBadge={false}
      disabled={false}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe('ServeSection — opções de detalhe (rodapé)', () => {
  it('não renderiza o selo de saque no rodapé (movido para o bloco inline sob o card do sacador)', () => {
    renderSection();
    expect(screen.queryByText('1º SAQUE')).not.toBeInTheDocument();
    expect(screen.queryByText('2º SAQUE')).not.toBeInTheDocument();
  });

  it('dispara cada toggle no checkbox correspondente', () => {
    const { onAceDetailsToggle, onDfDetailsToggle } = renderSection();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Detalhes do ACE' }));
    expect(onAceDetailsToggle).toHaveBeenCalledTimes(1);
    expect(onDfDetailsToggle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Detalhes da DF' }));
    expect(onDfDetailsToggle).toHaveBeenCalledTimes(1);
  });

  it('desabilita os checkboxes quando disabled', () => {
    renderSection({ disabled: true });
    expect(screen.getByRole('checkbox', { name: 'Detalhes do ACE' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Detalhes da DF' })).toBeDisabled();
  });

  it('não renderiza Ace/Out/Net (ficam sob o card do sacador)', () => {
    renderSection();
    for (const name of ['Ace', 'Out', 'Net']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });
});
