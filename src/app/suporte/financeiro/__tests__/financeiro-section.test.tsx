/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FinanceiroSection } from '../../financeiro-section';

const mockFetch = jest.fn();
beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/suporte/financeiro/overview')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ inTrial: 5, active: 10, pastDue: 2, suspended: 1, estimatedMrr: 1500, totalPaidRevenue: 12000 }),
      });
    }
    if (url.includes('/api/suporte/financeiro/users')) {
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    }
    if (url.includes('/api/suporte/financeiro/invoices')) {
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    }
    if (url.includes('/api/suporte/financeiro/plans')) {
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('FinanceiroSection', () => {
  it('renderiza as subabas e inicia na Visão Geral', async () => {
    render(<FinanceiroSection />);

    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    expect(screen.getByText('Assinaturas & Usuários')).toBeInTheDocument();
    expect(screen.getByText('Cobranças')).toBeInTheDocument();
    expect(screen.getByText('Planos')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('MRR Estimado (Recorrente)')).toBeInTheDocument();
    });
  });

  it('navega para a subaba Assinaturas & Usuários ao clicar', async () => {
    render(<FinanceiroSection />);

    fireEvent.click(screen.getByText('Assinaturas & Usuários'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por nome, e-mail ou CPF...')).toBeInTheDocument();
    });
  });

  it('navega para a subaba Planos ao clicar', async () => {
    render(<FinanceiroSection />);

    fireEvent.click(screen.getByText('Planos'));

    await waitFor(() => {
      expect(screen.getByText('Catálogo de Planos')).toBeInTheDocument();
      expect(screen.getByText('+ Novo Plano')).toBeInTheDocument();
    });
  });
});
