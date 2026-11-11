/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditAthleteModal } from '../EditAthleteModal';

describe('EditAthleteModal — Abas de Dados Pessoais e Técnicos', () => {
  const athlete = {
    id: 'p-tab-1',
    name: 'Carlos Alcaraz',
    cpf: '12345678901',
    gender: 'MALE',
    birthDate: '2003-05-05',
    dominance: 'RIGHT',
    backhand: 'TWO_HANDED',
    rankings: {},
  };

  it('exibe as abas "1. Dados Pessoais" e "2. Dados Técnicos" e alterna entre elas', () => {
    render(
      <EditAthleteModal
        athlete={athlete as any}
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    const tabPessoais = screen.getByRole('tab', { name: /1\. Dados Pessoais/i });
    const tabTecnicos = screen.getByRole('tab', { name: /2\. Dados Técnicos/i });

    expect(tabPessoais).toHaveAttribute('aria-selected', 'true');
    expect(tabTecnicos).toHaveAttribute('aria-selected', 'false');

    // Clica na aba 2: Dados Técnicos
    fireEvent.click(tabTecnicos);
    expect(tabTecnicos).toHaveAttribute('aria-selected', 'true');
    expect(tabPessoais).toHaveAttribute('aria-selected', 'false');

    // Clica de volta na aba 1: Dados Pessoais
    fireEvent.click(tabPessoais);
    expect(tabPessoais).toHaveAttribute('aria-selected', 'true');
    expect(tabTecnicos).toHaveAttribute('aria-selected', 'false');
  });

  it('salva alterações preenchidas nas duas abas corretamente', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <EditAthleteModal
        athlete={athlete as any}
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    // Altera nome na aba de Dados Pessoais
    const nameInput = screen.getByLabelText(/Nome completo/i);
    fireEvent.change(nameInput, { target: { value: 'Carlos Alcaraz Garfia' } });

    // Alterna para Dados Técnicos e altera Dominância
    fireEvent.click(screen.getByRole('tab', { name: /2\. Dados Técnicos/i }));
    const dominanceSelect = screen.getByLabelText(/Lateralidade \/ Dominância/i);
    fireEvent.change(dominanceSelect, { target: { value: 'LEFT' } });

    // Salva pelo footer
    const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Carlos Alcaraz Garfia',
        dominance: 'LEFT',
      })
    );
  });
});

