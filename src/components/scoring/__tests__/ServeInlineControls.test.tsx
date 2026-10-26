/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServeInlineControls } from '@/components/scoring/ServeInlineControls';
import type { ServeInlineControlsProps } from '@/components/scoring/serve-inline.types';

function renderControls(overrides: Partial<ServeInlineControlsProps> = {}) {
  const props: ServeInlineControlsProps = {
    step: 'first',
    disabled: false,
    processing: false,
    openAction: null,
    onAction: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
  return render(<ServeInlineControls {...props} />);
}

describe('ServeInlineControls — Opção 3: Chip Compacto entre o Placar e os Botões Inline', () => {
  it('não exibe o chip de 2º saque quando step é "first"', () => {
    renderControls({ step: 'first' });
    expect(screen.queryByTestId('serve-inline-second-badge')).not.toBeInTheDocument();
    expect(screen.queryByText('2º Saque')).not.toBeInTheDocument();
  });

  it('exibe o chip divisor de 2º saque quando step é "second"', () => {
    renderControls({ step: 'second' });

    const badge = screen.getByTestId('serve-inline-second-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label', '2º Saque em andamento');

    const text = screen.getByText('2º Saque');
    expect(text).toHaveClass('bg-telemetry-alert');
    expect(text).toHaveClass('text-telemetry-base');
  });

  it('renderiza os botões Ace, Out e Net em ambos os steps', () => {
    renderControls({ step: 'second' });
    expect(screen.getByRole('button', { name: 'Ace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Net' })).toBeInTheDocument();
  });
});
