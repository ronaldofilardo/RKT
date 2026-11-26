import { safeCompareTokens } from '../asaas-webhook-auth';
import { buscarOuCriarCustomer } from '../asaas-customer.service';
import { criarAssinaturaAsaas } from '../asaas-subscription.service';
import { asaasFetch } from '../asaas-fetch';

jest.mock('../asaas-fetch', () => ({
  asaasFetch: jest.fn(),
}));

jest.mock('../asaas-config', () => ({
  getAsaasBaseUrl: () => 'https://sandbox.asaas.com/api/v3',
  getAsaasApiKey: () => 'test_api_key',
  getAsaasWebhookToken: () => 'secret_token_123',
}));

const mockAsaasFetch = asaasFetch as jest.MockedFunction<typeof asaasFetch>;

describe('Asaas Client & Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('safeCompareTokens valida token idêntico e rejeita divergente ou vazio', () => {
    expect(safeCompareTokens('token123', 'token123')).toBe(true);
    expect(safeCompareTokens('token123', 'token999')).toBe(false);
    expect(safeCompareTokens('', 'token123')).toBe(false);
  });

  it('buscarOuCriarCustomer retorna cliente existente por externalReference', async () => {
    mockAsaasFetch.mockResolvedValueOnce({
      data: [{ id: 'cus_1', name: 'Gestor Teste', cpfCnpj: '12345678901' }],
    } as any);

    const cus = await buscarOuCriarCustomer({
      name: 'Gestor Teste',
      cpfCnpj: '12345678901',
      email: 'gestor@ct.com',
      externalReference: 'CT:ct-1',
    });

    expect(cus.id).toBe('cus_1');
    expect(mockAsaasFetch).toHaveBeenCalledWith('/customers?externalReference=CT%3Act-1');
  });

  it('buscarOuCriarCustomer cria novo cliente quando inexistente', async () => {
    mockAsaasFetch
      .mockResolvedValueOnce({ data: [] } as any) // por ref
      .mockResolvedValueOnce({ data: [] } as any) // por cpf
      .mockResolvedValueOnce({ id: 'cus_new', name: 'Atleta Novo', cpfCnpj: '98765432100' } as any);

    const cus = await buscarOuCriarCustomer({
      name: 'Atleta Novo',
      cpfCnpj: '987.654.321-00',
      email: 'atleta@teste.com',
      externalReference: 'USER:u-1',
    });

    expect(cus.id).toBe('cus_new');
  });

  it('criarAssinaturaAsaas despacha POST /subscriptions com payload correto', async () => {
    mockAsaasFetch.mockResolvedValueOnce({
      id: 'sub_123',
      status: 'ACTIVE',
      value: 19.99,
    } as any);

    const sub = await criarAssinaturaAsaas({
      customer: 'cus_1',
      billingType: 'PIX',
      value: 19.99,
      nextDueDate: '2026-12-01',
      cycle: 'MONTHLY',
      description: 'Plano Atleta Pro',
      externalReference: 'USER:u-1',
    });

    expect(sub.id).toBe('sub_123');
    expect(mockAsaasFetch).toHaveBeenCalledWith('/subscriptions', expect.objectContaining({ method: 'POST' }));
  });
});

