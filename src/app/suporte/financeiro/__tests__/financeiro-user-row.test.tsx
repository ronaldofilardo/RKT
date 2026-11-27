/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinanceiroUserRow } from '../financeiro-user-row';
import type { FinancialUserItem } from '../financeiro-types';

describe('FinanceiroUserRow', () => {
  const mockUser: FinancialUserItem = {
    id: 'u1',
    name: 'Roberto Silva',
    email: 'roberto@tenis.com',
    cpf: '123.456.789-00',
    role: 'TREINADOR',
    createdAt: '2026-01-01T00:00:00.000Z',
    clubName: 'CT Morumbi',
    status: 'ACTIVE',
    planTier: 'COACH_START',
    planName: 'Coach Start',
    cycle: 'MONTHLY',
    billingType: 'PIX',
    monthlyFee: 49.99,
    dueDate: '2026-12-15T00:00:00.000Z',
    matchesUsed: 5,
    matchesLimit: null,
    daysRemaining: null,
    canCreateMatch: true,
    message: 'Plano ativo.',
  };

  it('renderiza dados cadastrais e badges do usuário', () => {
    render(
      <table>
        <tbody>
          <FinanceiroUserRow user={mockUser} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Roberto Silva')).toBeInTheDocument();
    expect(screen.getByText('roberto@tenis.com')).toBeInTheDocument();
    expect(screen.getByText('CT Morumbi')).toBeInTheDocument();
    expect(screen.getByText('ATIVO')).toBeInTheDocument();
    expect(screen.getByText('Coach Start')).toBeInTheDocument();
    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText('R$ 49,99/mês')).toBeInTheDocument();
  });
});
