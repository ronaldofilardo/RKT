/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpectatorWakeLockToggle } from '../SpectatorWakeLockToggle';

describe('SpectatorWakeLockToggle', () => {
  const originalWakeLock = navigator.wakeLock;

  beforeEach(() => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: jest.fn() },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: originalWakeLock,
      configurable: true,
      writable: true,
    });
  });

  it('não renderiza se wakeLock não for suportado no navegador', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const { container } = render(<SpectatorWakeLockToggle isActive={true} onToggle={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza quando wakeLock é suportado e exibe estado ativo', () => {
    render(<SpectatorWakeLockToggle isActive={true} onToggle={jest.fn()} />);
    expect(screen.getByText('Tela sempre acesa')).toBeInTheDocument();
    const btn = screen.getByRole('switch');
    expect(btn).toHaveAttribute('aria-checked', 'true');
  });

  it('exibe estado de economia de bateria quando inativo', () => {
    render(<SpectatorWakeLockToggle isActive={false} onToggle={jest.fn()} />);
    expect(screen.getByText('Economia de bateria (tela apaga)')).toBeInTheDocument();
    const btn = screen.getByRole('switch');
    expect(btn).toHaveAttribute('aria-checked', 'false');
  });

  it('aciona onToggle ao clicar no switch', () => {
    const onToggle = jest.fn();
    render(<SpectatorWakeLockToggle isActive={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

