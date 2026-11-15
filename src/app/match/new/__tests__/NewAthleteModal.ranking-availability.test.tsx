/**
 * @jest-environment jsdom
 */
// Divisão de NewAthleteModal.characterization.test.tsx (381L) — ranking/idade.
// Kit compartilhado: newAthleteModalTestKit.tsx.
import { fireEvent, screen } from '@testing-library/react';
import { fillBirthDateForAge, installFetchMock, seedSessionStorage, setupModal } from './newAthleteModalTestKit';

const mockFetch = installFetchMock();

describe('NewAthleteModal — tipos de ranking disponíveis por idade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    seedSessionStorage();
  });

  it('shows all 7 ranking types when no age', () => {
    setupModal();
    expect(screen.getAllByRole('checkbox')).toHaveLength(7);
  });

  it('filters out ATP/WTA for age > 40', () => {
    setupModal();
    fillBirthDateForAge(45);
    const labels = screen.getAllByRole('checkbox').map((c) => c.closest('label')?.textContent || '');
    expect(labels).not.toContain('ATP');
    expect(labels).not.toContain('WTA');
  });

  it('filters out ITF_Juniors for age < 14', () => {
    setupModal();
    fillBirthDateForAge(12);
    const labels = screen.getAllByRole('checkbox').map((c) => c.closest('label')?.textContent || '');
    expect(labels).not.toContain('ITF Juniors');
  });
});
