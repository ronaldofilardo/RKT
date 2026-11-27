import { UpsertPlanSchema, listAllPlansLogic, updateOrCreatePlanLogic } from '../plans.logic';
import { fetchAllPlans, savePlan } from '@/core/billing/plans-repository';

jest.mock('@/core/billing/plans-repository', () => ({
  fetchAllPlans: jest.fn(),
  savePlan: jest.fn(),
}));

describe('plans.logic', () => {
  it('valida schema de plano com campos válidos', () => {
    const valid = {
      tierCode: 'CUSTOM_PRO',
      name: 'Custom Pro',
      target: 'ATLETA_INDEPENDENTE',
      monthlyPrice: 29.9,
      yearlyPrice: 299,
      quotaAthletes: 1,
      quotaCoaches: 0,
    };
    const parsed = UpsertPlanSchema.parse(valid);
    expect(parsed.tierCode).toBe('CUSTOM_PRO');
    expect(parsed.monthlyPrice).toBe(29.9);
  });

  it('listAllPlansLogic delega para fetchAllPlans', async () => {
    (fetchAllPlans as jest.Mock).mockResolvedValueOnce([
      { id: 'ATLETA_PRO', name: 'Atleta Pro', target: 'ATLETA_INDEPENDENTE', monthlyPrice: 19.99, yearlyPrice: 199.99, quotaAthletes: 1, quotaCoaches: 0, quotaMatches: null, tooltip: '', features: [] },
    ]);

    const res = await listAllPlansLogic();
    expect(res.items.length).toBe(1);
    expect(res.items[0].id).toBe('ATLETA_PRO');
  });

  it('updateOrCreatePlanLogic delega para savePlan', async () => {
    (savePlan as jest.Mock).mockResolvedValueOnce({
      id: 'COACH_START', name: 'Coach Start Alterado', target: 'TREINADOR_PARTICULAR', monthlyPrice: 59.99, yearlyPrice: 599.99, quotaAthletes: 6, quotaCoaches: 1, quotaMatches: null, tooltip: '', features: []
    });

    const res = await updateOrCreatePlanLogic({
      tierCode: 'COACH_START',
      name: 'Coach Start Alterado',
      target: 'TREINADOR_PARTICULAR',
      monthlyPrice: 59.99,
      yearlyPrice: 599.99,
      quotaAthletes: 6,
      quotaCoaches: 1,
      tooltip: '',
      features: [],
      isActive: true,
    });

    expect(res.ok).toBe(true);
    expect(res.plan.name).toBe('Coach Start Alterado');
  });
});
