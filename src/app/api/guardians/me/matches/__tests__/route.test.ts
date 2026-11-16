jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn((_req, _roles, _scope, handler) =>
    handler({ user: { id: 'u-guardian' } })
  ),
}));

jest.mock('../matches-read.logic', () => ({
  getGuardianMatches: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getGuardianMatches } from '../matches-read.logic';

describe('GET /api/guardians/me/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 200 com lista de partidas dos dependentes', async () => {
    (getGuardianMatches as jest.Mock).mockResolvedValue([
      {
        id: 'm-1',
        dependentName: 'Junior',
        opponentName: 'Lucas',
        createdByName: 'Prof Carlos',
        annotatorName: 'Prof Carlos',
        state: 'SCHEDULED',
      },
    ]);

    const req = new NextRequest('http://localhost/api/guardians/me/matches');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].createdByName).toBe('Prof Carlos');
  });
});
