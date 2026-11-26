/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrialCounterBar } from '../trial-counter-bar';
import type { BillingAccountState } from '@/types/billing';

describe('TrialCounterBar', () => {
  it('não renderiza nada se o billing for null ou ACTIVE', () => {
    const { container, rerender } = render(<TrialCounterBar billing={null} onOpenPlans={jest.fn()} />);
    expect(container.firstChild).toBeNull();

    const activeBilling: BillingAccountState = {
      status: 'ACTIVE', target: null, planId: null, matchesUsed: 10,
      matchesLimit: null, daysRemaining: null, daysLimit: null,
      canCreateMatch: true, canAddAthletes: true, message: 'Ativo',
    };
    rerender(<TrialCounterBar billing={activeBilling} onOpenPlans={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza contador normal para FREE_TRIAL', () => {
    const trialBilling: BillingAccountState = {
      status: 'FREE_TRIAL', target: 'ATLETA_INDEPENDENTE', planId: null, matchesUsed: 1,
      matchesLimit: 3, daysRemaining: null, daysLimit: null,
      canCreateMatch: true, canAddAthletes: true, message: '1 de 3',
    };
    render(<TrialCounterBar billing={trialBilling} onOpenPlans={jest.fn()} />);
    expect(screen.getByText('1/3 partidas')).toBeInTheDocument();
    expect(screen.getByText('Ver Planos')).toBeInTheDocument();
  });

  it('renderiza alerta e dispara onOpenPlans para LAST_FREE', () => {
    const onOpen = jest.fn();
    const lastFreeBilling: BillingAccountState = {
      status: 'LAST_FREE', target: 'ATLETA_INDEPENDENTE', planId: null, matchesUsed: 2,
      matchesLimit: 3, daysRemaining: null, daysLimit: null,
      canCreateMatch: true, canAddAthletes: true, message: 'Última partida',
    };
    render(<TrialCounterBar billing={lastFreeBilling} onOpenPlans={onOpen} />);
    expect(screen.getByText('Último Acesso Livre')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver Planos'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renderiza aviso de Modo Consulta quando EXPIRED', () => {
    const expiredBilling: BillingAccountState = {
      status: 'EXPIRED', target: 'ATLETA_INDEPENDENTE', planId: null, matchesUsed: 3,
      matchesLimit: 3, daysRemaining: null, daysLimit: null,
      canCreateMatch: false, canAddAthletes: false, message: 'Expirado',
    };
    render(<TrialCounterBar billing={expiredBilling} onOpenPlans={jest.fn()} />);
    expect(screen.getByText('Modo Consulta')).toBeInTheDocument();
    expect(screen.getByText('Assinar Agora')).toBeInTheDocument();
  });
});
