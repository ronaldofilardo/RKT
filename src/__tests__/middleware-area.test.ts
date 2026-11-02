import { NextRequest } from 'next/server';
import {
  resolveUserActiveArea,
  mapPrefixedToInternalRoute,
  handleAreaRewriteOrRedirect,
} from '../middleware-area.logic';

describe('middleware-area.logic.ts', () => {
  it('resolve área ativa a partir de claims do token', () => {
    expect(resolveUserActiveArea({ sub: '1', role: 'ADMIN' })).toBe('ADMIN');
    expect(resolveUserActiveArea({ sub: '2', role: 'USER', pp: 'SUPORTE' })).toBe('SUPORTE');
    expect(resolveUserActiveArea({ sub: '3', role: 'USER', mk: 'GESTOR' })).toBe('GESTOR');
    expect(resolveUserActiveArea({ sub: '4', role: 'USER', mk: 'TREINADOR', cx: 'PARTICULAR' })).toBe('TREINADOR_AVULSO');
    expect(resolveUserActiveArea({ sub: '5', role: 'USER', ax: 'ATLETA' })).toBe('ATLETA');
  });

  it('mapeia prefixo da área para a rota interna correspondente', () => {
    expect(mapPrefixedToInternalRoute('/treinador', 'TREINADOR_AVULSO')).toBe('/dashboard');
    expect(mapPrefixedToInternalRoute('/treinador/partidasaovivo', 'TREINADOR_AVULSO')).toBe('/partidasaovivo');
    expect(mapPrefixedToInternalRoute('/atleta/match/new', 'ATLETA')).toBe('/match/new');
    expect(mapPrefixedToInternalRoute('/clube/gestor', 'GESTOR')).toBe('/gestor');
    expect(mapPrefixedToInternalRoute('/admin', 'ADMIN')).toBe('/admin');
  });

  it('redireciona rota legada /dashboard via 307 para o prefixo da área', () => {
    const req = new NextRequest(new URL('http://localhost/dashboard'));
    const headers = new Headers();
    const res = handleAreaRewriteOrRedirect(req, { sub: 'u1', role: 'TREINADOR', ax: 'TREINADOR_AVULSO' }, headers);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost/treinador');
  });

  it('redireciona rota legada /partidasaovivo via 307 preservando query params', () => {
    const req = new NextRequest(new URL('http://localhost/partidasaovivo?view=live'));
    const headers = new Headers();
    const res = handleAreaRewriteOrRedirect(req, { sub: 'u1', role: 'ATLETA', ax: 'ATLETA' }, headers);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost/atleta/partidasaovivo?view=live');
  });

  it('reescreve internamente quando a URL bate com o prefixo da área', () => {
    const req = new NextRequest(new URL('http://localhost/treinador/partidasaovivo'));
    const headers = new Headers();
    const res = handleAreaRewriteOrRedirect(req, { sub: 'u1', role: 'TREINADOR', ax: 'TREINADOR_AVULSO' }, headers);
    expect(res).not.toBeNull();
    expect(headers.get('x-active-area')).toBe('TREINADOR_AVULSO');
  });
});

