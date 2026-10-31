/**
 * @jest-environment jsdom
 *
 * Regressão do padrão visual do /suporte: as seções devem seguir o mesmo
 * padrão do /gestor (card de tabela, bordas translúcidas e badges com
 * modificadores de cor "/20"). Utilitários globais de opacidade (opacity-10/20/30)
 * são proibidos: eles desfam texto e linhas inteiros (bug de baixo contraste).
 */
import React from 'react';
import { render } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';
import { ClubesSection } from '../clubes-section';
import { GestoresSection } from '../gestores-section';
import { AvulsosSection } from '../avulsos-section';
import type { TrainingCenter, MembershipItem, UserItem } from '../types';

function makeCt(id: string, name: string, status: string): TrainingCenter {
  return {
    id, name, slug: id, status, cnpj: '11122233000191', legalName: 'Razão LTDA', phone: null,
    email: null, address: null, legalRepName: null, legalRepCpf: null, legalRepEmail: null,
    legalRepPhone: null,
  };
}

function classNamesOf(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('*')).map((el) => el.getAttribute('class') ?? '');
}

function expectNoGlobalOpacity(container: HTMLElement) {
  const offending = classNamesOf(container).filter((c) => /\bopacity-\d+\b/.test(c));
  expect(offending).toEqual([]);
}

function expectStandardTableCard(container: HTMLElement) {
  const table = container.querySelector('table');
  expect(table).toBeInTheDocument();
  const card = container.querySelector('.bg-telemetry-card');
  expect(card).toBeInTheDocument();
  expect(card!.contains(table!)).toBe(true);
  expect(card!.className).toContain('rounded-xl');
  expect(card!.className).toContain('border-telemetry-border/20');
}

describe('Padrão visual do /suporte (regressão do bug de baixo contraste)', () => {
  it('ClubesSection: sem opacidade global, com card padrão, badges "/20" e hover do /gestor', () => {
    const { container } = render(
      <ClubesSection
        clubs={[
          makeCt('ct-p', 'Clube Pendente', 'PENDING'),
          makeCt('ct-a', 'Clube Ativo', 'ACTIVE'),
          makeCt('ct-s', 'Clube Suspenso', 'SUSPENDED'),
        ]}
        filter="ALL" onFilterChange={jest.fn()} onApprove={jest.fn()} onSuspend={jest.fn()}
        onReactivate={jest.fn()} onEditClub={jest.fn()}
      />
    );

    expectNoGlobalOpacity(container);
    expectStandardTableCard(container);

    const classes = classNamesOf(container);
    expect(classes.some((c) => c.includes('hover:bg-telemetry-elevated/30'))).toBe(true);
    expect(classes.some((c) => c.includes('bg-telemetry-volt/20') && c.includes('text-telemetry-volt'))).toBe(true);
    expect(classes.some((c) => c.includes('bg-telemetry-alert/20') && c.includes('text-telemetry-alert'))).toBe(true);
    expect(classes.some((c) => c.includes('bg-telemetry-error/20') && c.includes('text-telemetry-error'))).toBe(true);
    expect(classes.some((c) => c.includes('p-0 sm:p-6 space-y-6'))).toBe(true);
  });

  it('GestoresSection: sem opacidade global e com card padrão', () => {
    const membership: MembershipItem = { id: 'm1', userId: 'u1', kind: 'GESTOR', ctId: 'ct1', status: 'ACTIVE', createdAt: '2026-01-01' };
    const user: UserItem = { id: 'u1', name: 'Eduardo', email: 'e@x.com', cpf: '1', role: 'GESTOR', canOperate: true, isActive: true, createdAt: '2026-01-01' };

    const { container } = render(
      <ToastProvider>
        <GestoresSection memberships={[membership]} users={[user]} clubs={[makeCt('ct1', 'CT Teste', 'ACTIVE')]} onEdit={jest.fn()} onRefresh={jest.fn()} />
      </ToastProvider>
    );

    expectNoGlobalOpacity(container);
    expectStandardTableCard(container);
  });

  it('AvulsosSection: cards no padrão do /gestor (rounded-xl + shadow + borda translúcida)', () => {
    const { container } = render(<AvulsosSection />);

    expectNoGlobalOpacity(container);
    const cards = container.querySelectorAll('.bg-telemetry-card');
    expect(cards).toHaveLength(3);
    cards.forEach((card) => {
      expect(card.className).toContain('rounded-xl');
      expect(card.className).toContain('shadow');
      expect(card.className).toContain('border-telemetry-border/20');
    });
  });
});
