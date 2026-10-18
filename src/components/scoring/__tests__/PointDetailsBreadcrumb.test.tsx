/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PointDetailsBreadcrumb } from '../point-details-breadcrumb';
import type { PointDetailsForm } from '../point-details-logic';

describe('PointDetailsBreadcrumb', () => {
  const emptyForm: PointDetailsForm = {
    situacao: null,
    tipo: null,
    golpe: null,
    subtipo1: null,
    subtipo2: null,
    efeito: null,
    duracao: null,
    direcao: null,
    golpeEsp: null,
  };

  it('exibe mensagem inicial quando nada estiver selecionado', () => {
    render(<PointDetailsBreadcrumb form={emptyForm} vencedor="sacador" />);
    expect(screen.getByText('Selecione a situação inicial do ponto')).toBeInTheDocument();
  });

  it('renderiza os steps conforme o formulário é preenchido', () => {
    const filledForm: PointDetailsForm = {
      ...emptyForm,
      situacao: 'fundo',
      tipo: 'winner',
      golpe: 'fh',
    };

    render(<PointDetailsBreadcrumb form={filledForm} vencedor="sacador" />);
    expect(screen.getByText('Fundo de Quadra')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Forehand (FH)')).toBeInTheDocument();
  });

  it('dispara onNavigateStep ao clicar em um item da trilha', () => {
    const onNavigateStep = jest.fn();
    const filledForm: PointDetailsForm = {
      ...emptyForm,
      situacao: 'fundo',
      tipo: 'winner',
      golpe: 'fh',
    };

    render(
      <PointDetailsBreadcrumb
        form={filledForm}
        vencedor="sacador"
        onNavigateStep={onNavigateStep}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Fundo de Quadra/i }));
    expect(onNavigateStep).toHaveBeenCalledWith('situacao');

    fireEvent.click(screen.getByRole('button', { name: /Winner/i }));
    expect(onNavigateStep).toHaveBeenCalledWith('tipo');
  });
});
