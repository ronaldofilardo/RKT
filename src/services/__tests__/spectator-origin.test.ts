import { resolveShareOrigin, getLanIpAddress } from '../spectator-origin.logic';

describe('resolveShareOrigin', () => {
  it('deve substituir localhost e 127.0.0.1 pelo IP local da rede mantendo a porta', () => {
    const lanIp = getLanIpAddress();
    const result = resolveShareOrigin('http://localhost:3000');
    if (lanIp) {
      expect(result).toBe(`http://${lanIp}:3000`);
    } else {
      expect(result).toBe('http://localhost:3000');
    }
  });

  it('deve manter a URL de producao inalterada', () => {
    const result = resolveShareOrigin('https://rkt.app');
    expect(result).toBe('https://rkt.app');
  });

  it('deve respeitar APP_URL quando configurada no ambiente', () => {
    const origEnv = process.env.APP_URL;
    process.env.APP_URL = 'https://custom.rkt.com';
    try {
      expect(resolveShareOrigin('http://localhost:3000')).toBe('https://custom.rkt.com');
    } finally {
      if (origEnv === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = origEnv;
    }
  });
});

