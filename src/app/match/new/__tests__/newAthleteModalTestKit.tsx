/**
 * Kit de teste compartilhado pelos arquivos NewAthleteModal.*.test.tsx.
 * Fora da coleta do Jest (nao termina em .test.tsx).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { NewAthleteModal } from '../components/NewAthleteModal';
import type { Athlete } from '../types';

export function installFetchMock() {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  return mockFetch;
}

export function setupModal(
  overrides: Partial<{ isOpen: boolean; onClose: () => void; onCreated: (a: Athlete) => void }> = {},
) {
  return render(
    <NewAthleteModal
      isOpen={overrides.isOpen ?? true}
      onClose={overrides.onClose ?? jest.fn()}
      onCreated={overrides.onCreated ?? jest.fn()}
    />,
  );
}

export function seedSessionStorage() {
  sessionStorage.clear();
  sessionStorage.setItem('access_token', 'test-token');
  sessionStorage.setItem('user_id', 'user-1');
}

export function fillBirthDate(day: string, month: string, year: string | number) {
  fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: day } });
  fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: month } });
  fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(year) } });
}

export function fillBirthDateForAge(age: number) {
  fillBirthDate('15', '03', new Date().getFullYear() - age);
}

export function fillFormForSubmit(name: string) {
  fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), { target: { value: name } });
  fillBirthDateForAge(20);
  fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
}
