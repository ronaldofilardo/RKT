import { asaasFetch } from './asaas-fetch';

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  billingType: string;
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export interface CriarAssinaturaParams {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  description: string;
  externalReference: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export async function criarAssinaturaAsaas(
  params: CriarAssinaturaParams,
): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function obterQrCodePixAsaas(paymentId: string): Promise<AsaasPixQrCodeResponse> {
  return asaasFetch<AsaasPixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`);
}

export async function obterPrimeiraCobrancaAssinatura(
  subscriptionId: string,
): Promise<{ id: string; invoiceUrl?: string; bankSlipUrl?: string } | null> {
  const res = await asaasFetch<{ data: Array<{ id: string; invoiceUrl?: string; bankSlipUrl?: string }> }>(
    `/subscriptions/${subscriptionId}/payments`,
  );
  return res.data && res.data.length > 0 ? res.data[0] : null;
}
