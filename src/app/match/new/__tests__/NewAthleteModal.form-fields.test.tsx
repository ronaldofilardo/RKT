/**
 * @jest-environment jsdom
 */
// Divisão de NewAthleteModal.characterization.test.tsx (381L) — campos do form.
// Kit compartilhado: newAthleteModalTestKit.tsx.
import { fireEvent, screen } from '@testing-library/react';
import { fillBirthDateForAge, installFetchMock, seedSessionStorage, setupModal } from './newAthleteModalTestKit';

const mockFetch = installFetchMock();

describe('NewAthleteModal — validação e campos básicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    seedSessionStorage();
  });

  it('Save button disabled when name is empty', () => {
    setupModal();
    expect(screen.getByRole('button', { name: 'Salvar Atleta' })).toBeDisabled();
  });

  it('Save button enabled when name is filled', () => {
    setupModal();
    fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), { target: { value: 'João' } });
    expect(screen.getByRole('button', { name: 'Salvar Atleta' })).not.toBeDisabled();
  });

  it('renders gender select with options', () => {
    setupModal();
    const genderSelect = screen.getByLabelText('Sexo');
    expect(genderSelect).toBeInTheDocument();
    expect(genderSelect).toHaveValue('');
    fireEvent.change(genderSelect, { target: { value: 'MALE' } });
    expect(genderSelect).toHaveValue('MALE');
  });

  it('renders birth date inputs (DD/MM/AAAA)', () => {
    setupModal();
    expect(screen.getAllByPlaceholderText('DD').length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText('MM').length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText('AAAA').length).toBeGreaterThan(0);
  });

  it('calculates age correctly from valid birth date', () => {
    setupModal();
    fillBirthDateForAge(20);
    expect(screen.getByText((_, element) => element?.textContent === 'Idade: 20 anos')).toBeInTheDocument();
  });

  it('renders dominance select', () => {
    setupModal();
    expect(screen.getByLabelText('Dominância')).toBeInTheDocument();
  });

  it('renders backhand select', () => {
    setupModal();
    expect(screen.getByLabelText('Backhand')).toBeInTheDocument();
  });
});
