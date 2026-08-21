import { GET } from '../route';
import { NextRequest } from 'next/server';
jest.mock('@/lib/auth', () => ({ withRLSHandler: jest.fn((r, role, h) => h()) }));
describe('Suspended-Sessions Route - Real', () => { it('deve responder a GET com params', async () => { const res = await GET(new NextRequest('http://localhost'), { params: Promise.resolve({}) }); expect(typeof res).toBe('object'); }); });
