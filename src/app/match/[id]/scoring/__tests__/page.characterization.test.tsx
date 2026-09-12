/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScoringPage from '../page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'match-smoke-test' }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../useScoringPageState', () => ({
  useScoringPageState: () => ({
    isLoading: false,
    error: 'Erro de teste de carregamento',
    match: null,
  }),
}));

jest.mock('../useScoringPageEffects', () => ({
  useScoringPageEffects: () => ({}),
}));

jest.mock('../useScoringPageDerived', () => ({
  useScoringPageDerived: () => ({}),
}));

describe('ScoringPage Smoke Characterization', () => {
  it('renderiza mensagem de erro quando há falha no carregamento', () => {
    render(<ScoringPage />);

    expect(screen.getByText('Erro de teste de carregamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar ao dashboard/i })).toBeInTheDocument();
  });
});
