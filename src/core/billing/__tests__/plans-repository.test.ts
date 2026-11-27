import { mapDbPlanToDefinition, fetchAllPlans, savePlan } from '../plans-repository';
import { prisma } from '@/lib/prisma';
import { BILLING_PLANS } from '../billing-plans';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    plan: {
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

describe('plans-repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mapDbPlanToDefinition converte registro do banco corretamente', () => {
    const raw = {
      tierCode: 'TEST_TIER',
      name: 'Plano Teste',
      target: 'ATLETA_INDEPENDENTE',
      monthlyPrice: '39.90',
      yearlyPrice: '399.00',
      quotaAthletes: 2,
      quotaCoaches: 1,
      quotaMatches: null,
      extraAthletePrice: '9.90',
      extraCoachPrice: null,
      tooltip: 'Tooltip de teste',
      features: [{ title: 'Feature 1', included: true }],
      isActive: true,
    };

    const res = mapDbPlanToDefinition(raw);
    expect(res.id).toBe('TEST_TIER');
    expect(res.name).toBe('Plano Teste');
    expect(res.monthlyPrice).toBe(39.9);
    expect(res.yearlyPrice).toBe(399);
    expect(res.extraAthletePrice).toBe(9.9);
    expect(res.isActive).toBe(true);
  });

  it('fetchAllPlans retorna planos do banco se existirem', async () => {
    (prisma.plan.findMany as jest.Mock).mockResolvedValueOnce([
      {
        tierCode: 'ATLETA_PRO',
        name: 'Atleta Pro',
        target: 'ATLETA_INDEPENDENTE',
        monthlyPrice: 19.99,
        yearlyPrice: 199.99,
        quotaAthletes: 1,
        quotaCoaches: 0,
        quotaMatches: null,
        tooltip: '',
        features: [],
        isActive: true,
      },
    ]);

    const plans = await fetchAllPlans();
    expect(plans.length).toBe(1);
    expect(plans[0].id).toBe('ATLETA_PRO');
  });

  it('savePlan executa upsert com dados normalizados', async () => {
    (prisma.plan.upsert as jest.Mock).mockResolvedValueOnce({
      tierCode: 'NEW_TIER',
      name: 'Novo Tier',
      target: 'TREINADOR_PARTICULAR',
      monthlyPrice: 89.9,
      yearlyPrice: 899.0,
      quotaAthletes: 10,
      quotaCoaches: 2,
      quotaMatches: null,
      tooltip: '',
      features: [],
      isActive: true,
    });

    const res = await savePlan({
      tierCode: 'NEW_TIER',
      name: 'Novo Tier',
      target: 'TREINADOR_PARTICULAR',
      monthlyPrice: 89.9,
      yearlyPrice: 899.0,
      quotaAthletes: 10,
      quotaCoaches: 2,
    });

    expect(prisma.plan.upsert).toHaveBeenCalled();
    expect(res.id).toBe('NEW_TIER');
    expect(res.monthlyPrice).toBe(89.9);
  });
});
