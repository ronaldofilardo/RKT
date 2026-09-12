/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LocateMatchesPage from '@/app/matches/locate/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LocateMatchesPage Characterization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ matches: [] }),
    } as any);
  });

  it('renderiza os filtros de busca e status de partidas', async () => {
    render(<LocateMatchesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Filtros/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Buscar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Partidas Encontradas/i })).toBeInTheDocument();
  });
});
