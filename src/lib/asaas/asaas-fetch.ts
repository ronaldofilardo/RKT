import { getAsaasBaseUrl, getAsaasApiKey } from './asaas-config';

export async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getAsaasBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: getAsaasApiKey(),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      Array.isArray((data as any)?.errors) && (data as any).errors[0]?.description
        ? (data as any).errors[0].description
        : `Erro ${res.status} ao comunicar com a API do Asaas.`;
    throw new Error(errorMsg);
  }

  return data as T;
}
