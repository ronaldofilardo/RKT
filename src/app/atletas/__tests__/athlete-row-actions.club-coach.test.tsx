/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AthleteRowActions } from '@/components/athlete/athlete-row-actions';

describe('AthleteRowActions — Regras de Treinador de Clube', () => {
  const athlete = { id: 'a-1', name: 'Atleta Teste' } as any;

  it('desabilita botao Editar para treinador de clube quando atleta < 18 anos', () => {
    const onEdit = jest.fn();
    render(
      <AthleteRowActions
        athlete={athlete}
        canDelete={false}
        isClubCoach={true}
        isUnder18={true}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    );

    const editBtn = screen.getByRole('button', { name: 'Editar' });
    expect(editBtn).toBeDisabled();
    fireEvent.click(editBtn);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('substitui por "Ver Ficha" com icone para treinador de clube quando atleta >= 18 anos', () => {
    const onEdit = jest.fn();
    render(
      <AthleteRowActions
        athlete={athlete}
        canDelete={false}
        isClubCoach={true}
        isUnder18={false}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    const viewBtn = screen.getByRole('button', { name: /Ver Ficha/i });
    expect(viewBtn).toBeInTheDocument();
    fireEvent.click(viewBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('mantem botao Editar habilitado para outros perfis (Gestor, Particular, Admin)', () => {
    const onEdit = jest.fn();
    render(
      <AthleteRowActions
        athlete={athlete}
        canDelete={true}
        isClubCoach={false}
        isUnder18={true}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    );

    const editBtn = screen.getByRole('button', { name: 'Editar' });
    expect(editBtn).not.toBeDisabled();
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});

