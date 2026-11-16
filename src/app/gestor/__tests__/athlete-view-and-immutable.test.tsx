/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AthletesTable } from '../athletes-table';
import { EditAthleteGuardianFields } from '@/app/atletas/components/EditAthleteGuardianFields';
import type { AthleteItem } from '../types';

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

describe('Atleta Menor — Visualização e Imutabilidade do Responsável', () => {
  const mockMinorAthleteConsented: AthleteItem = {
    player: {
      id: 'p-minor-1',
      name: 'Menor Consented',
      nickname: 'menorzinho',
      cpf: '12345678901',
      email: 'menor@clube.com',
      birthDate: '2012-05-10',
      gender: 'MALE',
      dominance: 'RIGHT',
      isConsented: true,
      guardianName: 'Pai Responsavel',
      guardianCpf: '98765432100',
      guardianPhone: '11999998888',
      guardianRelationship: 'Pai',
      user: { id: 'u-1', name: 'Menor Consented', cpf: '12345678901', email: 'menor@clube.com', mustChangePassword: false },
    },
  };

  it('permite clicar no nome do atleta para abrir a ficha em modo visualização', () => {
    render(
      <AthletesTable
        athletes={[mockMinorAthleteConsented]}
        selectedIds={[]}
        onSelectChange={jest.fn()}
        onSelectAll={jest.fn()}
        onCreateAthlete={jest.fn()}
      />
    );

    const nameBtn = screen.getByRole('button', { name: 'Menor Consented' });
    expect(nameBtn).toBeInTheDocument();
    fireEvent.click(nameBtn);

    // Modal de visualização abre como "Ficha do Atleta"
    expect(screen.getByText('Ficha do Atleta')).toBeInTheDocument();
  });

  it('exibe dados do responsável imutáveis e selo quando consentimento já foi confirmado', () => {
    const form = {
      name: 'Menor',
      cpf: '123',
      gender: 'MALE',
      birthDay: '10',
      birthMonth: '05',
      birthYear: '2012',
      dominance: 'RIGHT',
      guardianName: 'Pai Responsavel',
      guardianCpf: '98765432100',
      guardianPhone: '11999998888',
      guardianContact: 'Pai',
    };

    render(
      <EditAthleteGuardianFields
        form={form}
        setForm={jest.fn()}
        saving={false}
        immutable={true}
      />
    );

    expect(screen.getByText(/Consentimento Confirmado \(Imutável\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Consentimento certificado sob ECA Digital e LGPD/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nome do Responsável/i);
    const cpfInput = screen.getByLabelText(/CPF do Responsável/i);
    expect(nameInput).toBeDisabled();
    expect(cpfInput).toBeDisabled();
  });

  it('mantém campos editáveis quando o consentimento ainda não foi confirmado', () => {
    const form = {
      name: 'Menor',
      cpf: '123',
      gender: 'MALE',
      birthDay: '10',
      birthMonth: '05',
      birthYear: '2012',
      dominance: 'RIGHT',
      guardianName: 'Pai Pendente',
      guardianCpf: '98765432100',
    };

    render(
      <EditAthleteGuardianFields
        form={form}
        setForm={jest.fn()}
        saving={false}
        immutable={false}
      />
    );

    expect(screen.queryByText(/Consentimento Confirmado \(Imutável\)/i)).not.toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Nome do Responsável/i);
    expect(nameInput).not.toBeDisabled();
  });
});
