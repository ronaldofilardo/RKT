import {
  findDuplicates,
  isProbableDuplicate,
  normalizeName,
  sameCpfHash,
  sameDay,
  sameLast2AndDob,
  sameNameAndDob,
} from '../dedup';

const probe = (overrides: Partial<PlayerProbe> = {}): PlayerProbe => ({
  id: 'p-1',
  name: 'João Silva',
  cpfHash: 'hash-a',
  cpfLast2: '25',
  birthDate: new Date('1990-01-01T00:00:00Z'),
  ...overrides,
});
type PlayerProbe = {
  id: string;
  name?: string | null;
  cpfHash?: string | null;
  cpfLast2?: string | null;
  birthDate?: Date | null;
};

describe('Athlete Core: dedup (regras puras)', () => {
  it('normalizeName colapsa espacos e baixa caixa', () => {
    expect(normalizeName('  JOÃO   Silva  ')).toBe('joão silva');
  });

  it('sameDay compara ano/mes/dia em UTC', () => {
    expect(sameDay(new Date('1990-01-01T00:00:00Z'), new Date('1990-01-01T23:59:59Z'))).toBe(true);
    expect(sameDay(new Date('1990-01-01T00:00:00Z'), new Date('1990-01-02T00:00:00Z'))).toBe(false);
  });

  it('sameCpfHash exige ambos preenchidos e iguais', () => {
    expect(sameCpfHash(probe(), probe({ cpfHash: 'hash-a' }))).toBe(true);
    expect(sameCpfHash(probe({ cpfHash: null }), probe({ cpfHash: 'hash-b' }))).toBe(false);
    expect(sameCpfHash(probe({ cpfHash: 'hash-a' }), probe({ cpfHash: 'hash-b' }))).toBe(false);
  });

  it('sameLast2AndDob exige last2 e nascimento iguais', () => {
    expect(sameLast2AndDob(probe(), probe({ cpfLast2: '25' }))).toBe(true);
    expect(sameLast2AndDob(probe({ cpfLast2: '25' }), probe({ cpfLast2: '26' }))).toBe(false);
    expect(sameLast2AndDob(probe({ birthDate: new Date('1990-01-01') }), probe({ birthDate: new Date('1991-01-01') }))).toBe(false);
  });

  it('sameNameAndDob exige nome normalizado igual e nascimento igual', () => {
    expect(sameNameAndDob(probe({ name: 'João Silva' }), probe({ name: 'joão  silva' }))).toBe(true);
    expect(sameNameAndDob(probe({ name: 'João Silva' }), probe({ name: 'Maria Silva' }))).toBe(false);
  });

  it('isProbableDuplicate ignora o proprio id', () => {
    expect(isProbableDuplicate(probe(), probe())).toBe(false);
  });

  it('isProbableDuplicate detecta duplicata por cpfHash', () => {
    expect(isProbableDuplicate(probe(), probe({ id: 'p-2', cpfHash: 'hash-a' }))).toBe(true);
  });

  it('isProbableDuplicate detecta duplicata por last2 + nascimento', () => {
    expect(
      isProbableDuplicate(probe(), probe({ id: 'p-2', cpfHash: 'hash-b', cpfLast2: '25', birthDate: new Date('1990-01-01') })),
    ).toBe(true);
  });

  it('isProbableDuplicate detecta duplicata por nome + nascimento', () => {
    expect(
      isProbableDuplicate(probe(), probe({ id: 'p-2', cpfHash: 'hash-b', cpfLast2: '99', name: 'joão silva', birthDate: new Date('1990-01-01') })),
    ).toBe(true);
  });

  it('findDuplicates retorna candidatos excluindo o proprio', () => {
    const catalog = [
      probe({ id: 'p-2', cpfHash: 'hash-a' }),
      probe({ id: 'p-3', cpfHash: 'hash-b', name: null, cpfLast2: null, birthDate: null }),
      probe({ id: 'p-4', name: 'joão silva', birthDate: new Date('1990-01-01'), cpfHash: 'hash-c' }),
    ];
    const dups = findDuplicates(catalog, probe());
    expect(dups.map((d) => d.id)).toEqual(['p-2', 'p-4']);
  });
});
