import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    asaasWebhookEvent: { findUnique: jest.fn(), create: jest.fn() },
    subscription: { findUnique: jest.fn(), update: jest.fn() },
    invoice: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
  },
}));
jest.mock('@/lib/asaas/asaas-config', () => ({ getAsaasWebhookToken: () => 'valid_token_secret' }));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Asaas Webhook Handler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 401 para token inválido ou ausente', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: { 'asaas-access-token': 'wrong_token' },
      body: JSON.stringify({ event: 'PAYMENT_RECEIVED' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 200 com repetido: true se evento já processado', async () => {
    (mockPrisma.asaasWebhookEvent.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'evt_1', processedAt: new Date(),
    });
    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: { 'asaas-access-token': 'valid_token_secret' },
      body: JSON.stringify({ id: 'evt_1', event: 'PAYMENT_RECEIVED' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).repetido).toBe(true);
  });

  it('ativa assinatura ao receber PAYMENT_CONFIRMED', async () => {
    (mockPrisma.asaasWebhookEvent.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'sub_local_1', status: 'TRIAL' });
    (mockPrisma.invoice.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'inv_1', status: 'PENDING' });

    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: { 'asaas-access-token': 'valid_token_secret' },
      body: JSON.stringify({
        id: 'evt_pay_1',
        event: 'PAYMENT_CONFIRMED',
        payment: { id: 'pay_123', subscription: 'sub_asaas_1', status: 'CONFIRMED', value: 49.99, dueDate: '2026-12-01' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub_local_1' }, data: expect.objectContaining({ status: 'ACTIVE' }) }),
    );
  });

  it('cancela assinatura ao receber SUBSCRIPTION_DELETED', async () => {
    (mockPrisma.asaasWebhookEvent.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'sub_local_1', status: 'ACTIVE' });

    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: { 'asaas-access-token': 'valid_token_secret' },
      body: JSON.stringify({
        id: 'evt_sub_del',
        event: 'SUBSCRIPTION_DELETED',
        subscription: { id: 'sub_asaas_1', status: 'DELETED' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub_local_1' }, data: { status: 'CANCELED' } }),
    );
  });

  it('retorna 500 com mensagem estruturada quando ocorre erro interno de banco', async () => {
    (mockPrisma.asaasWebhookEvent.findUnique as jest.Mock).mockRejectedValueOnce(new Error('Erro de conexão com o banco'));
    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: { 'asaas-access-token': 'valid_token_secret' },
      body: JSON.stringify({ id: 'evt_err', event: 'PAYMENT_RECEIVED' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('INTERNAL_ERROR');
    expect(json.message).toContain('Erro de conexão com o banco');
  });
});
