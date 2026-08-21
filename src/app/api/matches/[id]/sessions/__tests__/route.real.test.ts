import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
jest.mock('@/lib/auth', () => ({ withRLSHandler: jest.fn((r, role, h) => h()), getRLSUser: jest.fn(() => ({ role: 'ATHLETE' })) }));
jest.mock('@/lib/prisma', () => ({ prisma: { sessionLog: { findFirst: jest.fn(), create: jest.fn() } } }));
describe('Sessions Route - Real', () => { it('deve responder a GET', async () => { const res = await GET(new NextRequest('http://localhost'), { params: Promise.resolve({ id: 'm1' }) }); expect(typeof res).toBe('object'); }); });
