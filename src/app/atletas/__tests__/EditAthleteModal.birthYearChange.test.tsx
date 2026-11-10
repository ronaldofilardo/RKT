/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditAthleteModal } from '../EditAthleteModal';

describe('EditAthleteModal — alteração dinâmica de ano de nascimento', () => {
  const currentYear = new Date().getFullYear();
  const adultYear = String(currentYear - 19); // 19 anos (ex: 2007)
  const youthYear = String(currentYear - 14); // 14 anos (ex: 2012)

  const athlete = {
    id: 'p-peter',
    name: 'Peter',
    gender: 'MALE',
    birthDate: `${adultYear}-05-01`,
    dominance: 'LEFT',
    backhand: 'ONE_HANDED',
    rankings: {
      ESTADUAL: { class: '1ªMA', position: 55 },
    },
  };

  it('exibe apenas rankings e campos relevantes para adulto (19 anos)', () => {
    render(
      <EditAthleteModal
        athlete={athlete as any}
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    // Estadual e ATP devem estar presentes
    expect(screen.getByLabelText('Estadual')).toBeInTheDocument();
    expect(screen.getByLabelText('ATP')).toBeInTheDocument();

    // CBT, COSAT e ITF Juniors não devem estar visíveis para adulto
    expect(screen.queryByLabelText('CBT')).toBeNull();
    expect(screen.queryByLabelText('COSAT')).toBeNull();
    expect(screen.queryByLabelText('ITF Juniors')).toBeNull();

    // Classe deve estar visível com valor 1ªMA
    expect(screen.getByDisplayValue('1ªMA')).toBeInTheDocument();

    // Categoria etária não deve estar presente para adulto
    expect(screen.queryByLabelText(/Categoria/i)).toBeNull();
  });

  it('ao alterar ano de nascimento para juvenil (14 anos), atualiza rankings dinamicamente', () => {
    render(
      <EditAthleteModal
        athlete={athlete as any}
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    const yearInput = screen.getByLabelText('Ano de nascimento');
    fireEvent.change(yearInput, { target: { value: youthYear } });

    // Agora rankings juvenis devem aparecer dinamicamente
    expect(screen.getByLabelText('CBT')).toBeInTheDocument();
    expect(screen.getByLabelText('COSAT')).toBeInTheDocument();
    expect(screen.getByLabelText('ITF Juniors')).toBeInTheDocument();

    // Categoria etária deve surgir no Estadual (com opção 13-14)
    expect(screen.getByLabelText(/Categoria/i)).toBeInTheDocument();
  });
});

