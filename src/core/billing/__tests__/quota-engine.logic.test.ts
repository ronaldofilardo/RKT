import { calculateBillingState, resolveBillingTarget } from '../quota-engine.logic';

describe('quota-engine.logic', () => {
  const baseDate = new Date('2026-01-01T12:00:00Z');

  it('deve conceder acesso ilimitado para usuários com plano pago ou vinculados', () => {
    const state = calculateBillingState({
      hasActivePaidPlan: true,
      matchesCount: 15,
      accountCreatedAt: baseDate,
    });
    expect(state.status).toBe('ACTIVE');
    expect(state.canCreateMatch).toBe(true);
    expect(state.matchesLimit).toBeNull();
  });

  it('deve retornar FREE_TRIAL para atleta independente com 0 ou 1 partida', () => {
    const state = calculateBillingState({
      activeArea: 'ATLETA',
      matchesCount: 1,
      accountCreatedAt: baseDate,
    });
    expect(state.status).toBe('FREE_TRIAL');
    expect(state.matchesLimit).toBe(3);
    expect(state.canCreateMatch).toBe(true);
  });

  it('deve retornar LAST_FREE para atleta independente com 2 partidas usadas', () => {
    const state = calculateBillingState({
      activeArea: 'ATLETA',
      matchesCount: 2,
      accountCreatedAt: baseDate,
    });
    expect(state.status).toBe('LAST_FREE');
    expect(state.matchesUsed).toBe(2);
    expect(state.canCreateMatch).toBe(true);
  });

  it('deve retornar EXPIRED e bloquear criação para atleta com 3 ou mais partidas', () => {
    const state = calculateBillingState({
      activeArea: 'ATLETA',
      matchesCount: 3,
      accountCreatedAt: baseDate,
    });
    expect(state.status).toBe('EXPIRED');
    expect(state.canCreateMatch).toBe(false);
  });

  it('deve calcular dias restantes para GESTOR de CT no período de 30 dias', () => {
    const now = new Date('2026-01-11T12:00:00Z'); // 10 dias depois
    const state = calculateBillingState({
      activeArea: 'GESTOR',
      matchesCount: 5,
      accountCreatedAt: baseDate,
      now,
    });
    expect(state.status).toBe('FREE_TRIAL');
    expect(state.daysRemaining).toBe(20);
    expect(state.canCreateMatch).toBe(true);
  });

  it('deve alertar LAST_FREE no 30o dia para GESTOR de CT', () => {
    const now = new Date('2026-01-30T12:00:00Z'); // 29 dias depois -> resta 1 dia
    const state = calculateBillingState({
      activeArea: 'GESTOR',
      matchesCount: 10,
      accountCreatedAt: baseDate,
      now,
    });
    expect(state.status).toBe('LAST_FREE');
    expect(state.daysRemaining).toBe(1);
    expect(state.canCreateMatch).toBe(true);
  });

  it('deve marcar EXPIRED para GESTOR de CT após os 30 dias', () => {
    const now = new Date('2026-02-05T12:00:00Z'); // 35 dias depois
    const state = calculateBillingState({
      activeArea: 'GESTOR',
      matchesCount: 12,
      accountCreatedAt: baseDate,
      now,
    });
    expect(state.status).toBe('EXPIRED');
    expect(state.daysRemaining).toBe(0);
    expect(state.canCreateMatch).toBe(false);
  });
});
