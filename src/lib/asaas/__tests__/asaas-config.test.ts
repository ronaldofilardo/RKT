import { getAsaasBaseUrl, getAsaasApiKey, getAsaasWebhookToken } from '../asaas-config';

describe('Asaas Config Environment Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('retorna URL de sandbox quando ASAAS_ENV=sandbox', () => {
    process.env.ASAAS_ENV = 'sandbox';
    expect(getAsaasBaseUrl()).toBe('https://sandbox.asaas.com/api/v3');
  });

  it('retorna URL de sandbox quando ASAAS_SANDBOX=true', () => {
    delete process.env.ASAAS_ENV;
    process.env.ASAAS_SANDBOX = 'true';
    expect(getAsaasBaseUrl()).toBe('https://sandbox.asaas.com/api/v3');
  });

  it('retorna URL de produção por padrão', () => {
    delete process.env.ASAAS_ENV;
    delete process.env.ASAAS_SANDBOX;
    expect(getAsaasBaseUrl()).toBe('https://api.asaas.com/v3');
  });

  it('getAsaasApiKey lança erro se chave ausente', () => {
    delete process.env.ASAAS_API_KEY;
    expect(() => getAsaasApiKey()).toThrow(/não configurada/i);
  });

  it('getAsaasApiKey retorna valor configurado', () => {
    process.env.ASAAS_API_KEY = 'test_key_123';
    expect(getAsaasApiKey()).toBe('test_key_123');
  });

  it('getAsaasWebhookToken retorna token com trim', () => {
    process.env.ASAAS_WEBHOOK_TOKEN = '  whsec_test_token  ';
    expect(getAsaasWebhookToken()).toBe('whsec_test_token');
  });
});
