import { generateAthleteCode, generateUniqueAthleteCode, isValidAthleteCode } from '../athlete-code';

describe('Athlete Core: athleteCode (geracao segura)', () => {
  it('generateAthleteCode retorna 8 caracteres do alfabeto permitido', () => {
    const code = generateAthleteCode();
    expect(code).toHaveLength(8);
    expect(isValidAthleteCode(code)).toBe(true);
  });

  it('generateAthleteCode nao usa Math.random (CSPRNG via crypto)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) codes.add(generateAthleteCode());
    expect(codes.size).toBeGreaterThan(1);
  });

  it('generateAthleteCode respeita o tamanho informado', () => {
    expect(generateAthleteCode(6)).toHaveLength(6);
    expect(generateAthleteCode(12)).toHaveLength(12);
  });

  it('isValidAthleteCode rejeita caracteres fora do alfabeto', () => {
    expect(isValidAthleteCode('ABCDEFGH')).toBe(true);
    expect(isValidAthleteCode('ABCDEFGI')).toBe(false); // I nao esta no alfabeto
    expect(isValidAthleteCode('ABCDEFG')).toBe(false); // 7 chars
    expect(isValidAthleteCode('ABCDEFGH1')).toBe(false); // 9 chars
  });

  it('generateUniqueAthleteCode retorna nao-colidido na primeira tentativa', async () => {
    const taken = new Set(['AAAAAAAA', 'BBBBBBBB']);
    const code = await generateUniqueAthleteCode((c) => taken.has(c));
    expect(isValidAthleteCode(code)).toBe(true);
    expect(taken.has(code)).toBe(false);
  });

  it('generateUniqueAthleteCode tenta novamente ate encontrar codigo livre', async () => {
    const attempts: string[] = [];
    const code = await generateUniqueAthleteCode(async (c) => {
      attempts.push(c);
      return c === 'AAAAAAAA' || c === 'BBBBBBBB';
    }, { maxAttempts: 50 });
    expect(isValidAthleteCode(code)).toBe(true);
    expect(code).not.toBe('AAAAAAAA');
    expect(code).not.toBe('BBBBBBBB');
  });

  it('generateUniqueAthleteCode lanc apos esgotar tentativas', async () => {
    await expect(() =>
      generateUniqueAthleteCode(async () => true, { maxAttempts: 3 }),
    ).rejects.toThrow(/Nao foi possivel gerar athleteCode unico apos 3 tentativas/);
  });
});
