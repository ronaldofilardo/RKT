import { processLoginSuccess } from '../login-success.logic';
import * as jwtClient from '@/lib/jwt-client';
import type { LoginResponse } from '@/lib/auth-client-login';

jest.mock('@/lib/jwt-client');
jest.mock('@/lib/auth-client', () => ({
  writeToSessionOnly: jest.fn(),
}));

describe('processLoginSuccess', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseResponse: LoginResponse = {
    accessToken: 'mock-token',
    user: { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'TREINADOR', mustChangePassword: false },
  };

  it('redireciona para /trocar-senha se mustChangePassword for true', async () => {
    const data = { ...baseResponse, user: { ...baseResponse.user, mustChangePassword: true } };
    await processLoginSuccess(data, new URLSearchParams(), mockPush);
    expect(mockPush).toHaveBeenCalledWith('/trocar-senha');
  });

  it('redireciona para home da área ativa se token possuir ax e apenas 1 área', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'u1', role: 'TREINADOR', ax: 'TREINADOR_AVULSO', ars: ['TREINADOR_AVULSO'],
    });
    await processLoginSuccess(baseResponse, new URLSearchParams(), mockPush);
    expect(mockPush).toHaveBeenCalledWith('/treinador');
  });

  it('redireciona para /escolher-area se o usuário tiver múltiplas áreas e nenhum next', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'u1', role: 'TREINADOR', ax: 'TREINADOR_AVULSO', ars: ['TREINADOR_AVULSO', 'ATLETA'],
    });
    await processLoginSuccess(baseResponse, new URLSearchParams(), mockPush);
    expect(mockPush).toHaveBeenCalledWith('/escolher-area');
  });

  it('respeita parâmetro next seguro se fornecido', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'u1', role: 'TREINADOR', ax: 'TREINADOR_AVULSO', ars: ['TREINADOR_AVULSO'],
    });
    const params = new URLSearchParams('next=%2Fmatch%2Fnew');
    await processLoginSuccess(baseResponse, params, mockPush);
    expect(mockPush).toHaveBeenCalledWith('/match/new');
  });

  it('bloqueia parâmetro next malicioso usando fallback da área', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'u1', role: 'TREINADOR', ax: 'TREINADOR_AVULSO', ars: ['TREINADOR_AVULSO'],
    });
    const params = new URLSearchParams('next=https%3A%2F%2Fevil.com');
    await processLoginSuccess(baseResponse, params, mockPush);
    expect(mockPush).toHaveBeenCalledWith('/treinador');
  });

  it('bloqueia next=/suporte para usuário sem área de suporte caindo no defaultHome', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'u1', role: 'TREINADOR', ax: 'TREINADOR_AVULSO', ars: ['TREINADOR_AVULSO'],
    });
    const params = new URLSearchParams('next=%2Fsuporte');
    await processLoginSuccess(baseResponse, params, mockPush);
    expect(mockPush).toHaveBeenCalledWith('/treinador');
  });

  it('permite next=/suporte para usuário com área SUPORTE', async () => {
    (jwtClient.decodeJwtPayload as jest.Mock).mockResolvedValue({
      sub: 'u-sup', role: 'SUPORTE', ax: 'SUPORTE', ars: ['SUPORTE'],
    });
    const params = new URLSearchParams('next=%2Fsuporte');
    await processLoginSuccess({ ...baseResponse, user: { ...baseResponse.user, role: 'SUPORTE' } }, params, mockPush);
    expect(mockPush).toHaveBeenCalledWith('/suporte');
  });
});

