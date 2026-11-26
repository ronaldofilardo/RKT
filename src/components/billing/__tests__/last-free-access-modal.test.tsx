/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LastFreeAccessModal } from '../last-free-access-modal';
import type { BillingAccountState } from '@/types/billing';

describe('LastFreeAccessModal', () => {
  const billing: BillingAccountState = {
    status: 'LAST_FREE', target: 'ATLETA_INDEPENDENTE', planId: null, matchesUsed: 2,
    matchesLimit: 3, daysRemaining: null, daysLimit: null,
    canCreateMatch: true, canAddAthletes: true, message: 'Última partida',
  };

  it('não renderiza se isOpen for false', () => {
    const { container } = render(
      <LastFreeAccessModal
        isOpen={false}
        billing={billing}
        onProceedLastFree={jest.fn()}
        onSubscribe={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza alerta de último acesso e permite avançar para último jogo', () => {
    const onProceed = jest.fn();
    render(
      <LastFreeAccessModal
        isOpen={true}
        billing={billing}
        onProceedLastFree={onProceed}
        onSubscribe={jest.fn()}
      />,
    );
    expect(screen.getByText(/Atenção: Este é o seu último acesso com anotação livre/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Utilizar meu último acesso gratuito agora/i));
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it('permite alternar ciclo e assinar plano', () => {
    const onSubscribe = jest.fn();
    render(
      <LastFreeAccessModal
        isOpen={true}
        billing={billing}
        onProceedLastFree={jest.fn()}
        onSubscribe={onSubscribe}
      />,
    );
    fireEvent.click(screen.getByText('Anual'));
    fireEvent.click(screen.getByText('Assinar Plano Escolhido'));
    expect(onSubscribe).toHaveBeenCalledWith('ATLETA_PRO', 'YEARLY');
  });

  it('exibe tooltip informativo com a franquia do plano ao clicar no botão i', () => {
    render(
      <LastFreeAccessModal
        isOpen={true}
        billing={billing}
        onProceedLastFree={jest.fn()}
        onSubscribe={jest.fn()}
      />,
    );
    const infoButton = screen.getByLabelText(/Detalhes do plano Atleta Pro/i);
    fireEvent.click(infoButton);
    expect(screen.getByText(/Franquia do Plano:/i)).toBeInTheDocument();
  });
});
