jest.mock('@/lib/match-events', () => ({
  subscribeMatch: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { subscribeMatch } from '@/lib/match-events';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockSubscribe = subscribeMatch as jest.MockedFunction<typeof subscribeMatch>;

let SPECTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  SPECTATOR_HEADERS = await makeAuthHeaders('user-spect', 'SPECTATOR');
});

describe('GET /api/matches/[id]/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue(jest.fn());
  });

  it('deve rejeitar se não há token', async () => {
    const { GET } = await import('../events/route');
    const req = new NextRequest('http://localhost:3000/api/matches/m-1/events');

    const res = await GET(req, { params: Promise.resolve({ id: 'm-1' }) });
    expect(res.status).toBe(401);
  });

  it('deve retornar SSE headers', async () => {
    const { GET } = await import('../events/route');
    const req = new NextRequest('http://localhost:3000/api/matches/m-1/events', {
      headers: SPECTATOR_HEADERS,
      signal: new AbortController().signal,
    });

    const res = await GET(req, { params: Promise.resolve({ id: 'm-1' }) });
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('deve inscrever no matchId correto', async () => {
    const { GET } = await import('../events/route');
    const req = new NextRequest('http://localhost:3000/api/matches/m-1/events', {
      headers: SPECTATOR_HEADERS,
      signal: new AbortController().signal,
    });

    await GET(req, { params: Promise.resolve({ id: 'm-1' }) });
    expect(mockSubscribe).toHaveBeenCalledWith('m-1', expect.any(Function));
  });
});
