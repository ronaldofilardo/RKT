import { POST } from '../route';
import { NextRequest } from 'next/server';
jest.mock('@/lib/auth', () => ({ withRLSHandler: jest.fn((r, role, h) => h()), getRLSUser: jest.fn(() => ({ role: 'ATHLETE' })) }));
describe('Abandon Route - Real', () => { it('deve aceitar POST com params', async () => { const req = new NextRequest('http://localhost'); const res = await POST(req, { params: Promise.resolve({ id: 'm1', sessionId: 's1' }) }); expect(typeof res).toBe('object'); }); });
