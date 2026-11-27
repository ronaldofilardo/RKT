import { resolveCheckoutPayer } from '../create-session/checkout-payer.logic';
import { processCheckoutSession } from '../create-session/checkout-session.logic';
import { calculateBillingState } from '@/core/billing/quota-engine.logic';
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

describe('CT Performance - Plano Mensal Centro de Treinamento', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolve dados do CT com CNPJ e externalReference CT:id', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u-gestor-1', name: 'Carlos Gestor', email: 'carlos@arena.com', cpf: '12345678900',
      memberships: [{ kind: 'GESTOR', ctId: 'ct-arena-1', ct: { id: 'ct-arena-1', name: 'Arena Beach Tennis', cnpj: '11222333000144', phone: '41988887777' } }],
      guardianLinks: [],
    });
    const payer = await resolveCheckoutPayer('u-gestor-1');
    expect(payer.isCt).toBe(true);
    expect(payer.ctId).toBe('ct-arena-1');
    expect(payer.name).toBe('Arena Beach Tennis');
    expect(payer.cpfCnpj).toBe('11222333000144');
    expect(payer.externalReference).toBe('CT:ct-arena-1');
  });

  it('executa checkout Pix do CT Performance no valor de R$ 299,99/mês', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u-gestor-1', name: 'Carlos Gestor', email: 'carlos@arena.com', cpf: '12345678900',
      memberships: [{ kind: 'GESTOR', ctId: 'ct-arena-1', ct: { id: 'ct-arena-1', name: 'Arena Beach Tennis', cnpj: '11222333000144', phone: '41988887777' } }],
      guardianLinks: [],
    });
    mockBuscar.mockResolvedValueOnce({ id: 'cus_ct_arena', name: 'Arena Beach Tennis' } as any);
    mockAssinatura.mockResolvedValueOnce({ id: 'sub_ct_perf', status: 'ACTIVE', value: 299.99 } as any);
    mockCobranca.mockResolvedValueOnce({ id: 'pay_ct_1', invoiceUrl: 'https://asaas.com/i/ct1' } as any);
    mockPix.mockResolvedValueOnce({ encodedImage: 'qr_base64_ct', payload: 'pix_copia_cola_ct', expirationDate: '2026-12-26' });
    (mockPrisma.subscription.create as jest.Mock).mockResolvedValueOnce({ id: 'sub_db_ct_perf' });

    const res = await processCheckoutSession('u-gestor-1', { planTier: 'CT_PERFORMANCE', cycle: 'MONTHLY', billingType: 'PIX' });
    expect(res.subscriptionId).toBe('sub_db_ct_perf');
    expect(res.value).toBe(299.99);
    expect(res.pix?.copiaECola).toBe('pix_copia_cola_ct');
    expect(mockAssinatura).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_ct_arena', value: 299.99, cycle: 'MONTHLY', externalReference: 'CT:ct-arena-1',
    }));
  });

  it('executa checkout Cartão do CT Performance retornando invoiceUrl hospedada no Asaas', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u-gestor-1', name: 'Carlos Gestor', email: 'carlos@arena.com', cpf: '12345678900',
      memberships: [{ kind: 'GESTOR', ctId: 'ct-arena-1', ct: { id: 'ct-arena-1', name: 'Arena Beach Tennis', cnpj: '11222333000144', phone: '41988887777' } }],
      guardianLinks: [],
    });
    mockBuscar.mockResolvedValueOnce({ id: 'cus_ct_arena', name: 'Arena Beach Tennis' } as any);
    mockAssinatura.mockResolvedValueOnce({ id: 'sub_ct_card', status: 'ACTIVE', value: 299.99 } as any);
    mockCobranca.mockResolvedValueOnce({ id: 'pay_card_ct', invoiceUrl: 'https://asaas.com/i/ct_card' } as any);
    (mockPrisma.subscription.create as jest.Mock).mockResolvedValueOnce({ id: 'sub_db_card_ct' });

    const res = await processCheckoutSession('u-gestor-1', {
      planTier: 'CT_PERFORMANCE', cycle: 'MONTHLY', billingType: 'CREDIT_CARD',
    });
    expect(res.subscriptionId).toBe('sub_db_card_ct');
    expect(res.invoiceUrl).toBe('https://asaas.com/i/ct_card');
    expect(res.value).toBe(299.99);
  });

  it('motor de quota valida CT Performance Mensal com acesso liberado', () => {
    const status = calculateBillingState({
      role: 'GESTOR',
      activeArea: 'GESTOR',
      matchesCount: 150,
      accountCreatedAt: new Date(),
      hasActivePaidPlan: true,
    });
    expect(status.status).toBe('ACTIVE');
    expect(status.canCreateMatch).toBe(true);
    expect(status.canAddAthletes).toBe(true);
  });
});
