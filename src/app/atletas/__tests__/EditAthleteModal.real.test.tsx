/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditAthleteModal } from '../EditAthleteModal';

describe('EditAthleteModal Real Tests', () => {
  const athlete = {
    id: 'p1',
    name: 'Eduardo Silveira',
    gender: 'MALE',
    birthDate: '2000-01-01',
    dominance: 'RIGHT',
    backhand: 'TWO_HANDED',
    rankings: {},
  };

  it('não renderiza nada se isOpen for false', () => {
    const { container } = render(
      <EditAthleteModal
        athlete={athlete as any}
        isOpen={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renderiza o formulário de edição e permite fechar pelo botão cancelar', () => {
    const onClose = jest.fn();
    render(
      <EditAthleteModal
        athlete={athlete as any}
        isOpen={true}
        onClose={onClose}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByText('Editar Atleta')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Eduardo Silveira')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
