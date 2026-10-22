/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EditScoreModal } from '../EditScoreModal';

describe('EditScoreModal - Doubles Mode', () => {
  it('renderiza os nomes compostos de duplas nos inputs e resumos', () => {
    render(
      <EditScoreModal
        isOpen={true}
        matchFormat="BEST_OF_3"
        playerNames={{ p1: 'Silva', p2: 'Oliveira' }}
        doubles={{
          player1PartnerName: 'Santos',
          player2PartnerName: 'Costa',
        }}
        currentSets={{ player1: 0, player2: 0 }}
        currentServer="player1"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getAllByText(/Silva \/ Santos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Oliveira \/ Costa/i).length).toBeGreaterThan(0);
  });
});
