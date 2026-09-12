/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SetInputForm, SetInputFormProps } from '../edit-score-form';

describe('edit-score-form Characterization', () => {
  const defaultProps: SetInputFormProps = {
    matchFormat: 'BEST_OF_3',
    totalEditedSets: 0,
    playerNames: { p1: 'Federer', p2: 'Nadal' },
    p1Input: '',
    p2Input: '',
    p1Points: '0',
    p2Points: '0',
    tiebreakP1: '',
    tiebreakP2: '',
    floorCurrentSets: null,
    floorValidationError: null,
    isMatchTiebreakSet: false,
    isPotentialMTSet: false,
    hasTiebreak: false,
    isSetTrulyCompleted: false,
    tiebreakComplete: false,
    tiebreakImpossible: false,
    partial: false,
    p1Val: 0,
    p2Val: 0,
    onP1InputChange: jest.fn(),
    onP2InputChange: jest.fn(),
    onP1PointsChange: jest.fn(),
    onP2PointsChange: jest.fn(),
    onTiebreakInputChange: jest.fn(),
    matchAlreadyOver: false,
    matchWouldEnd: false,
    p1SetsWon: 0,
    p2SetsWon: 0,
    maxSets: 3,
    showGamePointsAtZero: true,
    canConfirmSet: false,
    onConfirmSet: jest.fn(),
  };

  it('exibe mensagem de partida encerrada se matchAlreadyOver for true', () => {
    render(<SetInputForm {...defaultProps} matchAlreadyOver={true} />);

    expect(screen.getByText('Partida Encerrada')).toBeInTheDocument();
    expect(
      screen.getByText('A partida já foi finalizada. Não é possível adicionar novos sets.')
    ).toBeInTheDocument();
  });

  it('renderiza os campos de entrada do set quando a partida está ativa', () => {
    render(<SetInputForm {...defaultProps} />);

    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getAllByText('Federer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nadal').length).toBeGreaterThan(0);
  });
});
