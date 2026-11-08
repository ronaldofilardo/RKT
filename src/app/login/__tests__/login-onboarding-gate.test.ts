/**
 * @jest-environment jsdom
 */
import { processLoginSuccess } from '../login-success.logic';
import * as jwtClient from '@/lib/jwt-client';
import type { LoginResponse } from '@/lib/auth-client-login';
import { markOnboarded } from '@/lib/onboarding';

jest.mock('@/lib/jwt-client');
jest.mock('@/lib/auth-client', () => ({
  writeToSessionOnly: jest.fn(),
}));

describe('gate de onboarding no login', () => {
  const push = jest.fn();
  const baseResponse: LoginResponse = {
    accessToken: 'mock-token',
    user: { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'ATLETA', mustChangePassword: false },
  };

  beforeEach(() => {
    window.localStorage.clear();
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'u1',
      role: 'ATLETA',
      ax: 'ATLETA',
      ars: ['ATLETA'],
    });
  });

  it('envia o primeiro acesso para /onboarding preservando o destino', async () => {
    await processLoginSuccess(baseResponse, new URLSearchParams(), push);
    expect(push).toHaveBeenCalledWith('/onboarding?next=%2Fatleta&perfil=ATLETA');
  });

  it('infere atleta pelo availableAreas quando o token não traz área ativa', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({ sub: 'u1', role: 'ANNOTATOR' });
    await processLoginSuccess(
      {
        ...baseResponse,
        user: { ...baseResponse.user, role: 'ANNOTATOR' },
        availableAreas: [{ code: 'ANOTADOR' }, { code: 'ATLETA' }],
      },
      new URLSearchParams(),
      push,
    );
    expect(push).toHaveBeenCalledWith('/onboarding?next=%2Fatleta&perfil=ATLETA');
  });

  it('vai direto ao destino quando o onboarding já foi concluído', async () => {
    markOnboarded('u1');
    await processLoginSuccess(baseResponse, new URLSearchParams(), push);
    expect(push).toHaveBeenCalledWith('/atleta');
  });

  it('não aplica onboarding a perfis sem conteúdo (ADMIN)', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'admin',
      role: 'ADMIN',
      ax: 'ADMIN',
      ars: ['ADMIN'],
    });
    await processLoginSuccess(
      { ...baseResponse, user: { ...baseResponse.user, id: 'admin', role: 'ADMIN' } },
      new URLSearchParams(),
      push,
    );
    expect(push).toHaveBeenCalledWith('/admin');
  });
});
