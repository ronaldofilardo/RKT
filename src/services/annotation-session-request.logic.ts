export interface SessionServiceConfig {
  baseUrl: string;
}

export function createRequestFn(config: SessionServiceConfig) {
  return async function makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    errorMessage: string
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  };
}
