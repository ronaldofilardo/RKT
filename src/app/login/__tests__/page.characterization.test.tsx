/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LoginPage Characterization', () => {
  it('renderiza o formulário de login com campos de email e senha', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { level: 1, name: /RKT Tennis/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail ou CPF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });
});
