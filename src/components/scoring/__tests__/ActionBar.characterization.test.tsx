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
      onOutDirect={() => undefined}
      onNetDirect={() => undefined}
      dfDetailsEnabled={false}
      onDfDetailsToggle={() => undefined}
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

describe('ActionBar - Detalhes da DF', () => {
  it('quando desmarcado, Out chama onOutDirect e não abre modal', () => {
    const onOut = jest.fn();
    const onOutDirect = jest.fn();
    render(
      <ActionBar
        secondServe={false}
        serveStep="none"
        canUndo={false}
        canRedo={false}
        canEdit={false}
        fontScale={1}
        isFinished={false}
        onAceDirect={() => undefined}
        onAceWithDetails={() => undefined}
        onOut={onOut}
        onNet={() => undefined}
        onOutDirect={onOutDirect}
        onNetDirect={() => undefined}
        onServeCancel={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
        onFontSmaller={() => undefined}
        onFontBigger={() => undefined}
        onEditScore={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Out' }));

    expect(onOutDirect).toHaveBeenCalledTimes(1);
    expect(onOut).not.toHaveBeenCalled();
  });

  it('quando desmarcado, Net chama onNetDirect e não abre modal', () => {
    const onNet = jest.fn();
    const onNetDirect = jest.fn();
    render(
      <ActionBar
        secondServe={false}
        serveStep="none"
        canUndo={false}
        canRedo={false}
        canEdit={false}
        fontScale={1}
        isFinished={false}
        onAceDirect={() => undefined}
        onAceWithDetails={() => undefined}
        onOut={() => undefined}
        onNet={onNet}
        onOutDirect={() => undefined}
        onNetDirect={onNetDirect}
        onServeCancel={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
        onFontSmaller={() => undefined}
        onFontBigger={() => undefined}
        onEditScore={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Net' }));

    expect(onNetDirect).toHaveBeenCalledTimes(1);
    expect(onNet).not.toHaveBeenCalled();
  });

  it('quando marcado, Out chama onOut (modal) e não onOutDirect', () => {
    const onOut = jest.fn();
    const onOutDirect = jest.fn();
    render(
      <ActionBar
        secondServe={false}
        serveStep="none"
        canUndo={false}
        canRedo={false}
        canEdit={false}
        fontScale={1}
        isFinished={false}
        onAceDirect={() => undefined}
        onAceWithDetails={() => undefined}
        onOut={onOut}
        onNet={() => undefined}
        onOutDirect={onOutDirect}
        onNetDirect={() => undefined}
        onServeCancel={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
        onFontSmaller={() => undefined}
        onFontBigger={() => undefined}
        onEditScore={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Detalhes da DF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Out' }));

    expect(onOut).toHaveBeenCalledTimes(1);
    expect(onOutDirect).not.toHaveBeenCalled();
  });

  it('quando marcado, Net chama onNet (modal) e não onNetDirect', () => {
    const onNet = jest.fn();
    const onNetDirect = jest.fn();
    render(
      <ActionBar
        secondServe={false}
        serveStep="none"
        canUndo={false}
        canRedo={false}
        canEdit={false}
        fontScale={1}
        isFinished={false}
        onAceDirect={() => undefined}
        onAceWithDetails={() => undefined}
        onOut={() => undefined}
        onNet={onNet}
        onOutDirect={() => undefined}
        onNetDirect={onNetDirect}
        onServeCancel={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
        onFontSmaller={() => undefined}
        onFontBigger={() => undefined}
        onEditScore={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Detalhes da DF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Net' }));

    expect(onNet).toHaveBeenCalledTimes(1);
    expect(onNetDirect).not.toHaveBeenCalled();
  });

  it('checkbox Detalhes da DF alterna o estado interno', () => {
    render(
      <ActionBar
        secondServe={false}
        serveStep="none"
        canUndo={false}
        canRedo={false}
        canEdit={false}
        fontScale={1}
        isFinished={false}
        onAceDirect={() => undefined}
        onAceWithDetails={() => undefined}
        onOut={() => undefined}
        onNet={() => undefined}
        onOutDirect={() => undefined}
        onNetDirect={() => undefined}
        onServeCancel={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
        onFontSmaller={() => undefined}
        onFontBigger={() => undefined}
        onEditScore={() => undefined}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Detalhes da DF' });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
