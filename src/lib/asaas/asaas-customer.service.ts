import { asaasFetch } from './asaas-fetch';

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}

export interface BuscarOuCriarCustomerParams {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string | null;
  externalReference: string;
}

export async function buscarOuCriarCustomer(
  params: BuscarOuCriarCustomerParams,
): Promise<AsaasCustomer> {
  const cleanDoc = params.cpfCnpj.replace(/\D/g, '');

  if (params.externalReference) {
    try {
      const res = await asaasFetch<{ data: AsaasCustomer[] }>(
        `/customers?externalReference=${encodeURIComponent(params.externalReference)}`,
      );
      if (res.data && res.data.length > 0) return res.data[0];
    } catch {
      // Continua para busca por documento
    }
  }

  if (cleanDoc) {
    try {
      const res = await asaasFetch<{ data: AsaasCustomer[] }>(
        `/customers?cpfCnpj=${encodeURIComponent(cleanDoc)}`,
      );
      if (res.data && res.data.length > 0) return res.data[0];
    } catch {
      // Continua para criação
    }
  }

  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      cpfCnpj: cleanDoc,
      email: params.email,
      phone: params.phone ? params.phone.replace(/\D/g, '') : undefined,
      externalReference: params.externalReference,
    }),
  });
}
