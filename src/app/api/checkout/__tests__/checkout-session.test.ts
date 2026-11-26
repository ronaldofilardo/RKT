import { resolveCheckoutPayer } from '../create-session/checkout-payer.logic';
import { processCheckoutSession } from '../create-session/checkout-session.logic';
import { prisma } from '@/lib/prisma';
import { buscarOuCriarCustomer } from '@/lib/asaas/asaas-customer.service';
import {
  criarAssinaturaAsaas,
  obterPrimeiraCobrancaAssinatura,
  obterQrCodePixAsaas,
} from '@/lib/asaas/asaas-subscription.service';

jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: jest.fn() }, subscription: { create: jest.fn() } },
}));
jest.mock('@/lib/asaas/asaas-customer.service', () => ({ buscarOuCriarCustomer: jest.fn() }));
jest.mock('@/lib/asaas/asaas-subscription.service', () => ({
  criarAssinaturaAsaas: jest.fn(),
  obterPrimeiraCobrancaAssinatura: jest.fn(),
  obterQrCodePixAsaas: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBuscar = buscarOuCriarCustomer as jest.MockedFunction<typeof buscarOuCriarCustomer>;
const mockAssinatura = criarAssinaturaAsaas as jest.MockedFunction<typeof criarAssinaturaAsaas>;
const mockCobranca = obterPrimeiraCobrancaAssinatura as jest.MockedFunction<typeof obterPrimeiraCobrancaAssinatura>;
const mockPix = obterQrCodePixAsaas as jest.MockedFunction<typeof obterQrCodePixAsaas>;

describe('Checkout Session & Payer Resolution', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolveCheckoutPayer extrai dados do CT para Gestor', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u-gestor', name: 'Gestor Silva', email: 'gestor@ct.com', cpf: '11122233344',
      memberships: [{ kind: 'GESTOR', ctId: 'ct-1', ct: { id: 'ct-1', name: 'Clube Top', cnpj: '12345678000199', phone: '4199999999' } }],
      guardianLinks: [],
    });
    const payer = await resolveCheckoutPayer('u-gestor');
    expect(payer.isCt).toBe(true);
    expect(payer.name).toBe('Clube Top');
    expect(payer.cpfCnpj).toBe('12345678000199');
  });

  it('resolveCheckoutPayer bloqueia contratação se não tiver tutela sobre menor', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u-pai', name: 'Pai Silva', email: 'pai@email.com', cpf: '99988877766',
      memberships: [], guardianLinks: [{ playerId: 'outro-filho' }],
    });
    await expect(resolveCheckoutPayer('u-pai', 'filho-alheio')).rejects.toThrow(/Você não possui tutela autorizada/i);
  });

  it('processCheckoutSession orquestra customer, assinatura e salva no banco', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u-coach', name: 'Treinador João', email: 'joao@coach.com', cpf: '55566677788',
      memberships: [], guardianLinks: [],
    });
    mockBuscar.mockResolvedValueOnce({ id: 'cus_coach', name: 'Treinador João', cpfCnpj: '55566677788' } as any);
    mockAssinatura.mockResolvedValueOnce({ id: 'sub_asaas_1', status: 'ACTIVE', value: 49.99 } as any);
    mockCobranca.mockResolvedValueOnce({ id: 'pay_1', invoiceUrl: 'https://asaas.com/i/1' } as any);
    mockPix.mockResolvedValueOnce({ encodedImage: 'base64_qr', payload: 'copia_cola_code', expirationDate: '2026-12-01' });
    (mockPrisma.subscription.create as jest.Mock).mockResolvedValueOnce({ id: 'sub_db_1' });

    const res = await processCheckoutSession('u-coach', { planTier: 'COACH_START', cycle: 'MONTHLY', billingType: 'PIX' });
    expect(res.subscriptionId).toBe('sub_db_1');
    expect(res.value).toBe(49.99);
    expect(res.pix?.copiaECola).toBe('copia_cola_code');
  });
});
