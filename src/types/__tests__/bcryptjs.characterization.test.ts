import bcrypt, { hash, compare, hashSync, compareSync, genSaltSync } from 'bcryptjs';

describe('characterization: src/types/bcryptjs.d.ts (typing canônico)', () => {
  describe('API surface declarada', () => {
    it('deve expor named exports: hash, compare, hashSync, compareSync, genSaltSync', () => {
      expect(typeof hash).toBe('function');
      expect(typeof compare).toBe('function');
      expect(typeof hashSync).toBe('function');
      expect(typeof compareSync).toBe('function');
      expect(typeof genSaltSync).toBe('function');
    });

    it('default export deve ser um objeto com os mesmos métodos', () => {
      expect(typeof bcrypt).toBe('object');
      expect(typeof bcrypt.hash).toBe('function');
      expect(typeof bcrypt.compare).toBe('function');
      expect(typeof bcrypt.hashSync).toBe('function');
      expect(typeof bcrypt.compareSync).toBe('function');
      expect(typeof bcrypt.genSaltSync).toBe('function');
    });

    it('named e default export devem apontar para as mesmas funções', () => {
      expect(bcrypt.hash).toBe(hash);
      expect(bcrypt.compare).toBe(compare);
      expect(bcrypt.hashSync).toBe(hashSync);
      expect(bcrypt.compareSync).toBe(compareSync);
      expect(bcrypt.genSaltSync).toBe(genSaltSync);
    });
  });

  describe('contratos de assinatura (regressão de tipos)', () => {
    it('hash(data: string, saltOrRounds: string | number) -> Promise<string>', async () => {
      const result = await hash('senha123', 10);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('hash aceita rounds como número', async () => {
      const result = await hash('a', 4);
      expect(typeof result).toBe('string');
    });

    it('hash aceita salt como string (pre-gerado)', async () => {
      const salt = genSaltSync(4);
      const result = await hash('senha', salt);
      expect(typeof result).toBe('string');
    });

    it('compare(data: string, encrypted: string) -> Promise<boolean>', async () => {
      const hashed = await hash('segredo', 4);
      expect(await compare('segredo', hashed)).toBe(true);
      expect(await compare('errado', hashed)).toBe(false);
    });

    it('hashSync(data, saltOrRounds) -> string', () => {
      const result = hashSync('foo', 4);
      expect(typeof result).toBe('string');
    });

    it('compareSync(data, encrypted) -> boolean', () => {
      const hashed = hashSync('bar', 4);
      expect(compareSync('bar', hashed)).toBe(true);
      expect(compareSync('baz', hashed)).toBe(false);
    });

    it('genSaltSync(rounds?: number) -> string', () => {
      const salt = genSaltSync();
      expect(typeof salt).toBe('string');
    });
  });

  describe('uso real pelo código de produção', () => {
    it('hash + compare roundtrip deve funcionar com hash async', async () => {
      const password = 'integration-test-' + Date.now();
      const hashed = await hash(password, 4);
      expect(await compare(password, hashed)).toBe(true);
      expect(await compare('outra', hashed)).toBe(false);
    });

    it('hash + compare roundtrip deve funcionar com hash sync', () => {
      const password = 'sync-test-' + Date.now();
      const hashed = hashSync(password, 4);
      expect(compareSync(password, hashed)).toBe(true);
      expect(compareSync('outra', hashed)).toBe(false);
    });
  });
});
