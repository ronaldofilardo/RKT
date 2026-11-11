/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditAthleteModal } from '../EditAthleteModal';

describe('EditAthleteModal — Modo ReadOnly (Ver Ficha)', () => {
  const athlete = {
    id: 'p-adulto',
    name: 'Carlos Alberto',
    gender: 'MALE',
    birthDate: '2000-01-01',
    dominance: 'RIGHT',
    backhand: 'TWO_HANDED',
    rankings: {
      ESTADUAL: { class: '1ªMA', position: 10 },
    },
  };

  it('exibe Ficha do Atleta e botao Fechar sem botao Salvar', () => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    render(
      <EditAthleteModal
        athlete={athlete as any}
        isOpen={true}
        readOnly={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Ficha do Atleta')).toBeInTheDocument();
    expect(screen.queryByText('Salvar Alterações')).toBeNull();

    const closeBtn = screen.getByRole('button', { name: 'Fechar' });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const nameInput = screen.getByLabelText(/Nome/i);
    expect(nameInput).toBeDisabled();
  });
});

