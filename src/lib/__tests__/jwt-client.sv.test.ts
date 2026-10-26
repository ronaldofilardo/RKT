import { SignJWT } from 'jose';
import { decodeJwtPayload } from '@/lib/jwt-client';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'test-secret-at-least-32-chars-long');

const sign = (payload: object) =>
  new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().sign(secret);

describe('decodeJwtPayload — claim sv', () => {
  it('devolve sv quando numérico', async () => {
    const t = await sign({ sub: 'u1', role: 'ANNOTATOR', sv: 2 });
    await expect(decodeJwtPayload(t)).resolves.toEqual({ sub: 'u1', role: 'ANNOTATOR', sv: 2 });
  });

  it('ignora sv não numérico e não adiciona a chave', async () => {
    const t = await sign({ sub: 'u1', role: 'ANNOTATOR', sv: '2' });
    const result = await decodeJwtPayload(t);
    expect(result).toStrictEqual({ sub: 'u1', role: 'ANNOTATOR' });
  });
});
