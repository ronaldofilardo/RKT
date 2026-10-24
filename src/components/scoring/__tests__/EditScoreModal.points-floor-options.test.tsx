/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditScoreModal } from '../EditScoreModal';

describe('EditScoreModal - Bloqueio e liberação de pontos no game atual', () => {
  const baseProps = {
    isOpen: true,
    matchFormat: 'BEST_OF_3' as const,
    playerNames: { p1: 'Jogador 1', p2: 'Jogador 2' },
    currentServer: 'player1' as const,
    completedSets: [],
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  it('no mesmo game interrompido (0x1 com 0-15), opção 0 para Jogador 2 nem deve aparecer no dropdown', () => {
    render(
      <EditScoreModal
        {...baseProps}
        currentSets={{ player1: 0, player2: 1 }}
        floorCurrentSets={{ player1: 0, player2: 1 }}
        currentGamePoints={{ player1: '0', player2: '15' }}
      />
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects.length).toBeGreaterThanOrEqual(2);

    const p2Select = selects[1];
    expect(p2Select.value).toBe('15');

    const optionZeroP2 = Array.from(p2Select.options).find((opt) => opt.value === '0');
    expect(optionZeroP2).toBeUndefined();

    const optionFifteenP2 = Array.from(p2Select.options).find((opt) => opt.value === '15');
    expect(optionFifteenP2).toBeDefined();
  });

  it('ao aumentar o set de 0x1 para 1x1, as opções de pontos devem estar liberadas a partir de 0-0', () => {
    render(
      <EditScoreModal
        {...baseProps}
        currentSets={{ player1: 0, player2: 1 }}
        floorCurrentSets={{ player1: 0, player2: 1 }}
        currentGamePoints={{ player1: '0', player2: '15' }}
      />
    );

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const p1Input = inputs[0];

    // Altera games de Jogador 1 de 0 para 1 (set passa de 0x1 para 1x1)
    fireEvent.change(p1Input, { target: { value: '1' } });

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const p2Select = selects[1];

    const optionZeroP2 = Array.from(p2Select.options).find((opt) => opt.value === '0');
    expect(optionZeroP2?.disabled).toBe(false);

    // Agora Jogador 2 pode selecionar 0 livremente no novo game
    fireEvent.change(p2Select, { target: { value: '0' } });
    expect(p2Select.value).toBe('0');
  });
});
