import { checkAthleteExistingAccount } from '../athletes-account-check.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    player: { findFirst: jest.fn() },
  },
}));

describe('checkAthleteExistingAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna NONE quando CPF não existe nem em User nem em Player', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.player.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await checkAthleteExistingAccount('12345678909');
    expect(res.kind).toBe('NONE');
    expect(res.canLink).toBe(false);
  });

  it('classifica GUARDIAN_USER se a conta for de guardião com tutelas ativas', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u-parent',
      name: 'Pai do Atleta',
      guardianLinks: [{ id: 'gl-1' }],
    });

    const res = await checkAthleteExistingAccount('12345678909');
    expect(res.kind).toBe('GUARDIAN_USER');
    expect(res.canLink).toBe(false);
    expect(res.message).toContain('Responsável Legal Pai do Atleta');
  });

  it('classifica MINOR_WITH_GUARDIAN se o atleta for menor com tutor', async () => {
    const minorBirthDate = new Date();
    minorBirthDate.setFullYear(minorBirthDate.getFullYear() - 12);

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u-minor',
      name: 'Menor Silva',
      guardianLinks: [],
    });
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({
      id: 'p-minor',
      birthDate: minorBirthDate,
      guardianLinks: [{ guardian: { name: 'Mãe Silva' } }],
    });

    const res = await checkAthleteExistingAccount('12345678909');
    expect(res.kind).toBe('MINOR_WITH_GUARDIAN');
    expect(res.canLink).toBe(true);
    expect(res.statusToApply).toBe('PENDING');
    expect(res.guardianName).toBe('Mãe Silva');
  });

  it('classifica ADULT_ATHLETE se o atleta for maior de idade', async () => {
    const adultBirthDate = new Date();
    adultBirthDate.setFullYear(adultBirthDate.getFullYear() - 25);

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u-adult',
      name: 'Atleta Adulto',
      guardianLinks: [],
    });
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({
      id: 'p-adult',
      birthDate: adultBirthDate,
      guardianLinks: [],
    });

    const res = await checkAthleteExistingAccount('12345678909');
    expect(res.kind).toBe('ADULT_ATHLETE');
    expect(res.canLink).toBe(true);
    expect(res.statusToApply).toBe('ACTIVE');
  });

  it('classifica DEPENDENT_PLAYER_WITHOUT_USER se for dependente já cadastrado sem login', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({
      id: 'p-dep',
      name: 'Menor Dependente',
      userId: null,
      guardianLinks: [{ guardian: { name: 'Pai Registrador' } }],
    });

    const res = await checkAthleteExistingAccount('12345678909');
    expect(res.kind).toBe('DEPENDENT_PLAYER_WITHOUT_USER');
    expect(res.canLink).toBe(true);
    expect(res.statusToApply).toBe('PENDING');
  });
});
