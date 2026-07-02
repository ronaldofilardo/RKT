# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows\02-session-resume-ui.spec.ts >> Fluxo de Retomada: Dashboard -> Modal -> Scoring >> deve abrir modal de retomada e navegar para scoring após confirmação
- Location: e2e\flows\02-session-resume-ui.spec.ts:11:7

# Error details

```
Error: Login failed for admin@email.com: 429 {"error":"Muitas tentativas de login. Tente novamente em 30 minutos.","retryAfter":1800}
```

# Test source

```ts
  1  | import { request, APIRequestContext } from '@playwright/test';
  2  | 
  3  | export interface TestUser {
  4  |   email: string;
  5  |   password: string;
  6  |   name: string;
  7  |   role: string;
  8  | }
  9  | 
  10 | export const USERS = {
  11 |   athlete1: { email: 'play@email.com', password: '12345678', name: 'Jogador Atleta', role: 'ATHLETE' },
  12 |   athlete2: { email: 'player2@email.com', password: '12345678', name: 'Segundo Jogador', role: 'ATHLETE' },
  13 |   coach: { email: 'coach@email.com', password: '12345678', name: 'Técnico', role: 'COACH' },
  14 |   admin: { email: 'admin@email.com', password: '12345678', name: 'Administrador', role: 'ADMIN' },
  15 | } as const;
  16 | 
  17 | export type UserRole = keyof typeof USERS;
  18 | 
  19 | let cachedTokens: Partial<Record<UserRole, string>> = {};
  20 | let cachedIds: Partial<Record<UserRole, string>> = {};
  21 | 
  22 | export async function loginAs(role: UserRole): Promise<{ token: string; userId: string; api: APIRequestContext }> {
  23 |   if (cachedTokens[role] && cachedIds[role]) {
  24 |     const api = await request.newContext({ baseURL: 'http://localhost:3000' });
  25 |     return { token: cachedTokens[role]!, userId: cachedIds[role]!, api };
  26 |   }
  27 | 
  28 |   const user = USERS[role];
  29 |   const api = await request.newContext({ baseURL: 'http://localhost:3000' });
  30 | 
  31 |   const res = await api.post('/api/auth/login', {
  32 |     data: { email: user.email, password: user.password },
  33 |   });
  34 | 
  35 |   if (!res.ok()) {
  36 |     const body = await res.text();
> 37 |     throw new Error(`Login failed for ${user.email}: ${res.status()} ${body}`);
     |           ^ Error: Login failed for admin@email.com: 429 {"error":"Muitas tentativas de login. Tente novamente em 30 minutos.","retryAfter":1800}
  38 |   }
  39 | 
  40 |   const body = await res.json();
  41 |   cachedTokens[role] = body.accessToken;
  42 |   cachedIds[role] = body.user.id;
  43 | 
  44 |   return { token: body.accessToken, userId: body.user.id, api };
  45 | }
  46 | 
  47 | export function clearCache() {
  48 |   cachedTokens = {};
  49 |   cachedIds = {};
  50 | }
  51 | 
```