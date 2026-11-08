/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { getPasswordStrength, PasswordStrengthMeter } from '../ui/password-strength-meter';

describe('getPasswordStrength', () => {
  it('classifica fraca abaixo de 8 caracteres', () => {
    expect(getPasswordStrength('')).toBe('empty');
    expect(getPasswordStrength('abc123')).toBe('weak');
  });

  it('classifica média com 8+ caracteres sem combinação completa', () => {
    expect(getPasswordStrength('abcdefgh')).toBe('medium');
    expect(getPasswordStrength('12345678')).toBe('medium');
    expect(getPasswordStrength('abcdef12')).toBe('medium');
  });

  it('classifica forte com letras, números e caractere especial', () => {
    expect(getPasswordStrength('abcdef1!')).toBe('strong');
  });
});

describe('PasswordStrengthMeter', () => {
  it('não renderiza nada com senha vazia', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o rótulo e a quantidade de segmentos preenchidos', () => {
    const { container, rerender } = render(<PasswordStrengthMeter password="abc" />);
    expect(screen.getByRole('status')).toHaveTextContent('Força da senha: Fraca');
    expect(container.querySelectorAll('.bg-telemetry-error')).toHaveLength(1);

    rerender(<PasswordStrengthMeter password="abcdef12" />);
    expect(screen.getByRole('status')).toHaveTextContent('Força da senha: Média');

    rerender(<PasswordStrengthMeter password="abcdef1!" />);
    expect(screen.getByRole('status')).toHaveTextContent('Força da senha: Forte');
    expect(container.querySelectorAll('.bg-telemetry-volt')).toHaveLength(3);
  });
});
