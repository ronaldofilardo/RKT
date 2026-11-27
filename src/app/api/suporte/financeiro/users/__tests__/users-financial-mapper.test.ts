import { mapUserFinancialStatus, type RawFinancialUserData } from '../users-financial-mapper';

describe('mapUserFinancialStatus', () => {
  it('mapeia usuário com assinatura ativa corretamente', () => {
    const raw: RawFinancialUserData = {
      id: 'u1',
      name: 'Carlos Coach',
      email: 'carlos@test.com',
      cpf: '12345678900',
      role: 'TREINADOR',
      createdAt: new Date('2026-01-01'),
      matchesCount: 15,
      clubName: 'CT Central',
      isLinkedToPayingEntity: false,
      subscription: {
        planTier: 'COACH_PRO',
        cycle: 'MONTHLY',
        status: 'ACTIVE',
        currentPeriodEnd: new Date('2026-12-31'),
        invoices: [{ billingType: 'PIX', dueDate: new Date('2026-12-31') }],
      },
    };

    const result = mapUserFinancialStatus(raw);
    expect(result.id).toBe('u1');
    expect(result.status).toBe('ACTIVE');
    expect(result.planTier).toBe('COACH_PRO');
    expect(result.monthlyFee).toBe(79.99);
    expect(result.billingType).toBe('PIX');
    expect(result.canCreateMatch).toBe(true);
  });

  it('mapeia usuário em degustação com partidas livres restantes', () => {
    const raw: RawFinancialUserData = {
      id: 'u2',
      name: 'Atleta Novo',
      email: 'atleta@test.com',
      cpf: null,
      role: 'ATLETA',
      createdAt: new Date(),
      matchesCount: 1,
      clubName: null,
      isLinkedToPayingEntity: false,
      subscription: null,
    };

    const result = mapUserFinancialStatus(raw);
    expect(result.status).toBe('FREE_TRIAL');
    expect(result.planTier).toBeNull();
    expect(result.matchesUsed).toBe(1);
    expect(result.matchesLimit).toBe(3);
    expect(result.monthlyFee).toBe(0);
    expect(result.canCreateMatch).toBe(true);
  });

  it('mapeia usuário com degustação expirada em modo restrito', () => {
    const raw: RawFinancialUserData = {
      id: 'u3',
      name: 'Atleta Expirado',
      email: 'exp@test.com',
      cpf: null,
      role: 'ATLETA',
      createdAt: new Date(),
      matchesCount: 3,
      clubName: null,
      isLinkedToPayingEntity: false,
      subscription: null,
    };

    const result = mapUserFinancialStatus(raw);
    expect(result.status).toBe('EXPIRED');
    expect(result.canCreateMatch).toBe(false);
  });
});
