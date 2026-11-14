/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditAthleteModal } from '../EditAthleteModal';

describe('EditAthleteModal — Modo Novo Atleta (athlete=null)', () => {
  it('renderiza título "Novo Atleta", abas Dados Pessoais e Técnicos', () => {
    render(
      <EditAthleteModal
        athlete={null}
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /Novo Atleta/i })).toBeInTheDocument();
    expect(screen.getByText(/Preencha os dados pessoais e técnicos/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /1\. Dados Pessoais/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /2\. Dados Técnicos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Atleta/i })).toBeDisabled();
  });

  it('permite preencher dados pessoais e técnicos e salva o novo atleta', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <EditAthleteModal
        athlete={null}
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    // 1. Dados Pessoais
    fireEvent.change(screen.getByLabelText(/Nome completo/i), { target: { value: 'Mateus Silva' } });
    fireEvent.change(screen.getByLabelText(/Apelido/i), { target: { value: 'mateusinho' } });
    fireEvent.change(screen.getByLabelText(/CPF/i), { target: { value: '12345678901' } });
    fireEvent.change(screen.getByLabelText(/Sexo/i), { target: { value: 'MALE' } });
    fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '08' } });
    fireEvent.change(screen.getByPlaceholderText('AAAA'), { target: { value: '2005' } });

    // 2. Dados Técnicos
    fireEvent.click(screen.getByRole('tab', { name: /2\. Dados Técnicos/i }));
    fireEvent.change(screen.getByLabelText(/Lateralidade/i), { target: { value: 'RIGHT' } });
    fireEvent.change(screen.getByLabelText(/Backhand/i), { target: { value: 'TWO_HANDED' } });

    const saveBtn = screen.getByRole('button', { name: /Salvar Atleta/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mateus Silva',
          nickname: 'mateusinho',
          cpf: '12345678901',
          gender: 'MALE',
          birthDate: '2005-08-10',
          dominance: 'RIGHT',
          backhand: 'TWO_HANDED',
        })
      );
    });
  });
});
