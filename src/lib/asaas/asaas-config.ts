export function getAsaasBaseUrl(): string {
  return process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3';
}

export function getAsaasApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error('ASAAS_API_KEY não configurada no ambiente.');
  }
  return key;
}

export function getAsaasWebhookToken(): string {
  return (process.env.ASAAS_WEBHOOK_TOKEN ?? '').trim();
}
