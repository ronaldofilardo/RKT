/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { CoachMobileCard } from '../coach-mobile-card';
import { AffiliatesMobileCard } from '../affiliates-mobile-card';

describe('Cards mobile do Gestor (CoachMobileCard e AffiliatesMobileCard)', () => {
  const coach = {
    id: 'c1',
    canInsertAthletes: true,
    user: { id: 'u1', name: 'Carlos Moyá', cpf: '11122233344', email: 'moya@ct.com', createdAt: '2026-01-01', mustChangePassword: false },
  };

  const affiliate = {
    id: 'af1',
    name: 'João Fonseca',
    nickname: 'joao',
    clubName: 'CT RKT',
    coachName: 'Carlos Moyá',
    city: 'Rio de Janeiro',
    state: 'RJ',
    dominance: 'RIGHT',
    backhand: 'TWO_HANDED',
    gender: 'MALE',
    age: 18,
    rankings: null,
  };

  it('renderiza CoachMobileCard e aciona edição', () => {
    const onEdit = jest.fn();
    render(
      <CoachMobileCard
        coach={coach} selected={false} onSelect={jest.fn()} onEdit={onEdit}
        onGenerateLink={jest.fn()} onToggleCanInsertAthletes={jest.fn()}
      />,
    );
    expect(screen.getByText('Carlos Moyá')).toBeInTheDocument();
    expect(screen.getByText('111.222.333-44')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renderiza AffiliatesMobileCard com nickname limpo e clube', () => {
    render(<AffiliatesMobileCard athlete={affiliate} />);
    expect(screen.getByText('João Fonseca')).toBeInTheDocument();
    expect(screen.getByText('@joao')).toBeInTheDocument();
    expect(screen.getByText('CT RKT')).toBeInTheDocument();
  });
});
