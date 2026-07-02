jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/match-events', () => ({
  subscribeMatch: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { subscribeMatch } from '@/lib/match-events';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockSubscribe = subscribeMatch as jest.MockedFunction<typeof subscribeMatch>;

describe('GET /api/matches/[id]/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(null);
    mockSubscribe.mockReturnValue(jest.fn());
  });

  it('deve verificar role SPECTATOR', async () => {
    mockRequireRole.mockResolvedValue(new Response('Unauthorized', { status: 401 }) as any);

    const { GET } = await import('../events/route');
    const req = new NextRequest('http://localhost:3000/api/matches/m-1/events');

    const res = await GET(req, { params: Promise.resolve({ id: 'm-1' }) });
    expect(res.status).toBe(401);
  });

  it('deve retornar SSE headers', async () => {
    mockSubscribe.mockReturnValue(jest.fn());

    const { GET } = await import('../events/route');
    const req = new NextRequest('http://localhost:3000/api/matches/m-1/events', {
      signal: new AbortController().signal,
    });

    const res = await GET(req, { params: Promise.resolve({ id: 'm-1' }) });
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('deve inscrever no matchId correto', async () => {
    const { GET } = await import('../events/route');
    const req = new NextRequest('http://localhost:3000/api/matches/m-1/events', {
      signal: new AbortController().signal,
    });

    await GET(req, { params: Promise.resolve({ id: 'm-1' }) });
    expect(mockSubscribe).toHaveBeenCalledWith('m-1', expect.any(Function));
  });
});
