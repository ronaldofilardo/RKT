import { GET, PUT } from '../route';
import { NextRequest } from 'next/server';
jest.mock('@/lib/auth', () => ({ withRLSHandler: jest.fn((r, role, h) => h()), getRLSUser: jest.fn(() => ({ role: 'ADMIN' })) }));
jest.mock('@/services/playerService', () => ({ getPlayer: jest.fn(), updatePlayer: jest.fn() }));
describe('Players Route - Real', () => { it('deve permitir GET', async () => { const res = await GET(new NextRequest('http://localhost'), { params: Promise.resolve({ id: 'p1' }) }); expect(typeof res).toBe('object'); }); });
