/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanCardItem } from '../plan-card-item';
import { BILLING_PLANS } from '@/core/billing/billing-plans';

const plan = BILLING_PLANS[0];

describe('PlanCardItem (card é o <label> nativo do rádio)', () => {
  it('reflete o estado selecionado no rádio', () => {
    render(<PlanCardItem plan={plan} cycle="MONTHLY" isSelected onSelect={jest.fn()} />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('clique em qualquer ponto do card seleciona o plano (ativação do label)', () => {
    const onSelect = jest.fn();
    render(<PlanCardItem plan={plan} cycle="MONTHLY" isSelected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(plan.name));
    expect(onSelect).toHaveBeenCalledWith(plan.id);
  });

  it('clique no "i" abre o tooltip SEM selecionar o plano', () => {
    const onSelect = jest.fn();
    render(<PlanCardItem plan={plan} cycle="MONTHLY" isSelected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: `Detalhes do plano ${plan.name}` }));
    expect(screen.getByText('Franquia do Plano:')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('exibe o preço mensal com vírgula decimal', () => {
    render(<PlanCardItem plan={plan} cycle="MONTHLY" isSelected={false} onSelect={jest.fn()} />);
    expect(screen.getByText(/R\$ 19,99/)).toBeInTheDocument();
  });
});
