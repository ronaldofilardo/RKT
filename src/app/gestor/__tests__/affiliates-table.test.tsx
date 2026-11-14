/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AffiliatesTable } from '../affiliates-table';
import type { AffiliateAthleteItem } from '../affiliates.types';

const mockAthletes: AffiliateAthleteItem[] = [
  {
    id: 'p-1', name: 'Carlos Alcaraz', nickname: 'carlitos',
    clubName: 'CT Morumbi', coachName: 'Juan Carlos', dominance: 'RIGHT',
    backhand: 'TWO_HANDED', gender: 'MALE', age: 21,
    rankings: { cbt: { position: 1 }, estadual: { category: '12M' } },
    city: 'São Paulo', state: 'SP',
  },
  {
    id: 'p-2', name: 'Jannik Sinner', nickname: 'fox', clubName: null,
    coachName: null, dominance: 'RIGHT', backhand: 'TWO_HANDED', gender: 'MALE',
    age: 23, rankings: null, city: 'San Candido', state: 'BZ',
  },
];

describe('AffiliatesTable - Painel do Gestor', () => {
  it('renderiza atletas com suas informações e badges técnicas', () => {
    render(<AffiliatesTable athletes={mockAthletes} />);

    expect(screen.getByText('Carlos Alcaraz')).toBeInTheDocument();
    expect(screen.getByText('@carlitos')).toBeInTheDocument();
    expect(screen.getByText('CT Morumbi')).toBeInTheDocument();
    expect(screen.getByText('Juan Carlos')).toBeInTheDocument();
    expect(screen.getByText('São Paulo / SP')).toBeInTheDocument();
    expect(screen.getByText('CBT: #1 · ESTADUAL (12M)')).toBeInTheDocument();
    expect(screen.getByText('Jannik Sinner')).toBeInTheDocument();
    expect(screen.getByText('Avulso / Sem vínculo')).toBeInTheDocument();
  });

  it('filtra atletas por termo de busca', () => {
    render(<AffiliatesTable athletes={mockAthletes} />);

    const searchInput = screen.getByPlaceholderText(/buscar por nome/i);
    fireEvent.change(searchInput, { target: { value: 'carlitos' } });

    expect(screen.getByText('Carlos Alcaraz')).toBeInTheDocument();
    expect(screen.queryByText('Jannik Sinner')).not.toBeInTheDocument();
  });

  it('exibe mensagem quando nenhum atleta for encontrado no filtro', () => {
    render(<AffiliatesTable athletes={mockAthletes} />);

    const searchInput = screen.getByPlaceholderText(/buscar por nome/i);
    fireEvent.change(searchInput, { target: { value: 'nadal' } });

    expect(screen.getByText('Nenhum atleta encontrado.')).toBeInTheDocument();
  });
});
