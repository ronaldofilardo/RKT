/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ActionBar } from '@/components/scoring/ActionBar';

type Props = React.ComponentProps<typeof ActionBar>;

function renderBar(overrides: Partial<Props> = {}) {
  const props: Props = {
    secondServe: false,
    serveStep: 'none',
    canUndo: false,
    canEdit: false,
    fontScale: 1,
    isFinished: false,
    aceDetailsEnabled: false,
    dfDetailsEnabled: false,
    onAceDetailsToggle: () => undefined,
    onDfDetailsToggle: () => undefined,
    onVoltar: () => undefined,
    onFontSmaller: () => undefined,
    onFontBigger: () => undefined,
    onEditScore: () => undefined,
    ...overrides,
  };
  return render(<ActionBar {...props} />);
}

describe('ActionBar - Ace/Out/Net saíram do rodapé (agora sob o card do sacador)', () => {
  it('não renderiza os botões Ace, Out e Net', () => {
    renderBar();

    for (const name of ['Ace', 'Out', 'Net']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });

  it('mantém os dois checkboxes de detalhe no rodapé sem o selo de saque duplicado', () => {
    renderBar();

    expect(screen.queryByText('1º SAQUE')).not.toBeInTheDocument();
    expect(screen.queryByText('2º SAQUE')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Detalhes do ACE' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Detalhes da DF' })).toBeInTheDocument();
  });
});

describe('ActionBar - checkboxes de detalhe (estado controlado pelo hook)', () => {
  it('refletem aceDetailsEnabled / dfDetailsEnabled', () => {
    renderBar({ aceDetailsEnabled: true, dfDetailsEnabled: false });

    expect(screen.getByRole('checkbox', { name: 'Detalhes do ACE' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Detalhes da DF' })).not.toBeChecked();
  });

  it('chamam os toggles ao clicar', () => {
    const onAceDetailsToggle = jest.fn();
    const onDfDetailsToggle = jest.fn();
    renderBar({ onAceDetailsToggle, onDfDetailsToggle });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Detalhes do ACE' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Detalhes da DF' }));

    expect(onAceDetailsToggle).toHaveBeenCalledTimes(1);
    expect(onDfDetailsToggle).toHaveBeenCalledTimes(1);
  });

  it('ficam desabilitados com a partida finalizada', () => {
    renderBar({ isFinished: true });

    expect(screen.getByRole('checkbox', { name: 'Detalhes do ACE' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Detalhes da DF' })).toBeDisabled();
  });
});

describe('ActionBar - Editar Placar bloqueado durante anotação de 2º saque', () => {
  // BUG FIX (2026-09-27): "Editar Placar" podia ser aberto/confirmado
  // enquanto um erro de 1º saque estava pendente (serveStep === 'second'),
  // sem limpar esse estado local — o firstFaultDetail do saque anotado
  // antes da edição ficava "grudado" e era enviado junto do próximo ponto
  // fechado após a edição, contaminando a anotação detalhada desse ponto
  // no /report. Agora o botão fica desabilitado nesse estado.
  it('desabilita o botão ✏️ quando serveStep é "second" (erro de 1º saque pendente)', () => {
    renderBar({ secondServe: true, serveStep: 'second', canEdit: true });
    expect(screen.getByRole('button', { name: 'Corrigir placar' })).toBeDisabled();
  });

  it('mantém o botão ✏️ habilitado quando serveStep é "none"', () => {
    renderBar({ canEdit: true });
    expect(screen.getByRole('button', { name: 'Corrigir placar' })).not.toBeDisabled();
  });

  it('onEditScore não é chamado ao clicar no botão desabilitado', () => {
    const onEditScore = jest.fn();
    renderBar({ secondServe: true, serveStep: 'second', canEdit: true, onEditScore });

    fireEvent.click(screen.getByRole('button', { name: 'Corrigir placar' }));
    expect(onEditScore).not.toHaveBeenCalled();
  });
});

describe('ActionBar - Remoção dos botões de escala de fonte (A- / A+)', () => {
  it('não renderiza os botões A-, A+ nem a porcentagem de escala de fonte', () => {
    renderBar({ canUndo: true, canEdit: true });

    expect(screen.queryByRole('button', { name: 'A-' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'A+' })).not.toBeInTheDocument();
    expect(screen.queryByText(/100%/)).not.toBeInTheDocument();
  });
});
