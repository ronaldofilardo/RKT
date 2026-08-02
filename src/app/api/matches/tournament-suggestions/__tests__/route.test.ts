import { NextRequest } from 'next/server';

jest.mock('@/services/matchSuggestionService', () => ({
  getTournamentSuggestions: jest.fn(),
}));

import { GET } from '@/app/api/matches/tournament-suggestions/route';
import { getTournamentSuggestions } from '@/services/matchSuggestionService';

const mockGetSuggestions = getTournamentSuggestions as jest.MockedFunction<
  typeof getTournamentSuggestions
>;

describe('GET /api/matches/tournament-suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar sugestões como JSON (200) sem filtro', async () => {
    const suggestions = [
      { name: 'Aberto do Brasil', count: 12 },
      { name: 'Torneio de SP', count: 4 },
    ];
    mockGetSuggestions.mockResolvedValue(suggestions as any);

    const req = new NextRequest(
      'http://localhost:3000/api/matches/tournament-suggestions',
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(suggestions);
    expect(mockGetSuggestions).toHaveBeenCalledWith('');
  });

  it('deve repassar o query param tournamentName para o service', async () => {
    mockGetSuggestions.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/matches/tournament-suggestions?tournamentName=Aberto',
    );
    await GET(req);

    expect(mockGetSuggestions).toHaveBeenCalledWith('Aberto');
  });

  it('deve retornar 500 quando o service lança erro', async () => {
    mockGetSuggestions.mockRejectedValue(new Error('db down'));

    const req = new NextRequest(
      'http://localhost:3000/api/matches/tournament-suggestions',
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('deve aceitar tournamentName vazio (falsy → string vazia)', async () => {
    mockGetSuggestions.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/matches/tournament-suggestions?tournamentName=',
    );
    await GET(req);

    expect(mockGetSuggestions).toHaveBeenCalledWith('');
  });
});
