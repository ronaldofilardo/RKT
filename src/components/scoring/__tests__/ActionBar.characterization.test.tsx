/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ActionBar } from '@/components/scoring/ActionBar';

function renderActionBar(onAceDirect: () => void, onAceWithDetails: () => void) {
  return render(
    <ActionBar
      secondServe={false}
      serveStep="none"
      canUndo={false}
      canRedo={false}
      canEdit={false}
      fontScale={1}
      isFinished={false}
      onAceDirect={onAceDirect}
      onAceWithDetails={onAceWithDetails}
      onOut={() => undefined}
      onNet={() => undefined}
      onServeCancel={() => undefined}
      onUndo={() => undefined}
      onRedo={() => undefined}
      onFontSmaller={() => undefined}
      onFontBigger={() => undefined}
      onEditScore={() => undefined}
    />,
  );
}

describe('ActionBar - Detalhes do ACE', () => {
  it('envia false e não abre o fluxo de detalhes quando a opção está desmarcada', () => {
    const onAce = jest.fn();
    const onAceWithDetails = jest.fn();
    renderActionBar(onAce, onAceWithDetails);

    fireEvent.click(screen.getByRole('button', { name: 'Ace' }));

    expect(onAce).toHaveBeenCalledTimes(1);
    expect(onAceWithDetails).not.toHaveBeenCalled();
    expect(screen.queryByText('Efeito do Saque')).not.toBeInTheDocument();
  });

  it('envia true quando o anotador habilita os detalhes do ACE', () => {
    const onAce = jest.fn();
    const onAceWithDetails = jest.fn();
    renderActionBar(onAce, onAceWithDetails);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Detalhes do ACE' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ace' }));

    expect(onAce).not.toHaveBeenCalled();
    expect(onAceWithDetails).toHaveBeenCalledTimes(1);
  });
});
