/**
 * @jest-environment jsdom
 *
 * TD-067 (§3.4 do PLANO_ONBOARDING_UX_FEEDBACK): barra de progresso no
 * modal do gestor + validação onBlur de CNPJ, Telefone e CEP.
 *
 * O onBlur já era suportado pelo FormField (prop `validate` + handleBlur);
 * este teste caracteriza que os 3 campos do onboarding o utilizam.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalHeader } from '../modal-header';
import { GestorOnboardingStep1 } from '../gestor-onboarding-step1';
import { initialStep1 } from '../gestor-onboarding-logic';

describe('ModalHeader — barra de progresso', () => {
  it('Etapa 1 exibe 50%', () => {
    render(<ModalHeader step={1} onClose={jest.fn()} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByTestId('gestor-onboarding-progress-fill')).toHaveStyle({ width: '50%' });
  });

  it('Etapa 2 exibe 100%', () => {
    render(<ModalHeader step={2} onClose={jest.fn()} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByTestId('gestor-onboarding-progress-fill')).toHaveStyle({ width: '100%' });
  });
});

describe('GestorOnboardingStep1 — validação onBlur (CNPJ, Telefone, CEP)', () => {
  function setup() {
    return render(
      <GestorOnboardingStep1
        form={initialStep1}
        onChange={jest.fn()}
        onAddressChange={jest.fn()}
        onNext={jest.fn()}
        submitting={false}
      />,
    );
  }

  function blurAndGetError(inputId: string, errorId: string): HTMLElement | null {
    // por id: 'Telefone' aparece 2x (campo principal e do representante legal)
    const input = document.getElementById(inputId);
    if (!input) throw new Error(`input ${inputId} não encontrado`);
    fireEvent.blur(input);
    return document.getElementById(errorId);
  }

  it('não mostra erros antes do blur', () => {
    setup();
    expect(document.getElementById('gestor-cnpj-error')).toBeNull();
    expect(document.getElementById('gestor-telefone-error')).toBeNull();
    expect(document.getElementById('gestor-endereco-cep-error')).toBeNull();
  });

  it('CNPJ inválido aparece no blur', () => {
    setup();
    const err = blurAndGetError('gestor-cnpj', 'gestor-cnpj-error');
    expect(err).not.toBeNull();
    expect(err?.textContent).toMatch(/CNPJ/);
  });

  it('Telefone inválido aparece no blur', () => {
    setup();
    const err = blurAndGetError('gestor-telefone', 'gestor-telefone-error');
    expect(err).not.toBeNull();
    expect(err?.textContent).toMatch(/Telefone/);
  });

  it('CEP inválido aparece no blur', () => {
    setup();
    const err = blurAndGetError('gestor-endereco-cep', 'gestor-endereco-cep-error');
    expect(err).not.toBeNull();
    expect(err?.textContent).toMatch(/CEP/);
  });
});
