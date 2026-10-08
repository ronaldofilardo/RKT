/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';


jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    use: (promiseOrValue: any) => {
      if (promiseOrValue && typeof promiseOrValue.then === 'function') {
        let result: any;
        promiseOrValue.then((val: any) => {
          result = val;
        });
        return result ?? { id: 'match-xyz' };
      }
      return promiseOrValue;
    },
  };
});

import ReportPage from '../page';


const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../ReportPage.view', () => ({
  ReportPageView: ({ matchId, totalPoints, p1Points, p2Points }: any) => (
    <div data-testid="report-page-view">
      <span>Match: {matchId}</span>
      <span>Total: {totalPoints}</span>
      <span>P1: {p1Points}</span>
      <span>P2: {p2Points}</span>
    </div>
  ),
}));

describe('ReportPage', () => {
  const matchId = 'match-xyz';
  const mockParams = Promise.resolve({ id: matchId });

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    global.fetch = jest.fn();
  });

  it('redireciona para /login se a rota retornar 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 401 });
    render(<ReportPage params={mockParams} />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('faz fetch de /api/matches/[id]/report apenas uma vez graças a fetchedMatchIdRef', async () => {
    sessionStorage.setItem('access_token', 'valid-token');

    const mockReportData = {
      match: {
        id: matchId,
        player1: { name: 'Tenista 1' },
        player2: { name: 'Tenista 2' },
      },
      timelinePoints: [
        { winner: 'PLAYER_1' },
        { winner: 'PLAYER_2' },
        { winner: 'PLAYER_1' },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockReportData)
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData,
    });

    const { rerender } = render(<ReportPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByTestId('report-page-view')).toBeInTheDocument();
    });

    expect(screen.getByText(`Match: ${matchId}`)).toBeInTheDocument();
    expect(screen.getByText('Total: 3')).toBeInTheDocument();
    expect(screen.getByText('P1: 2')).toBeInTheDocument();
    expect(screen.getByText('P2: 1')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Re-render não deve refazer fetch nem poluir o servidor com requisições redundantes
    rerender(<ReportPage params={mockParams} />);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('exibe erro caso a requisição falhe', async () => {
    sessionStorage.setItem('access_token', 'valid-token');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Partida não encontrada' }),
    });

    render(<ReportPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('Partida não encontrada')).toBeInTheDocument();
    });
    expect(screen.getByText('Voltar ao dashboard')).toBeInTheDocument();
  });
});
