/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutModal } from '../checkout-modal';

describe('CheckoutModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não renderiza se isOpen for false', () => {
    const { container } = render(
      <CheckoutModal
        isOpen={false}
        planId="ATLETA_PRO"
        cycle="MONTHLY"
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza valor do plano e botão de gerar Pix', () => {
    render(
      <CheckoutModal
        isOpen={true}
        planId="ATLETA_PRO"
        cycle="MONTHLY"
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );

    expect(screen.getByText(/Checkout Asaas — Atleta Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 19,99/i)).toBeInTheDocument();
    expect(screen.getByText(/Pagar com Pix Instantâneo/i)).toBeInTheDocument();
  });

  it('chama API de create-session e exibe QR code do Pix', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          subscriptionId: 'sub_123',
          pix: {
            qrCodeBase64: 'mock_qr_image',
            copiaECola: '00020126580014br.gov.bcb.pix...',
          },
        },
      }),
    } as any);

    render(
      <CheckoutModal
        isOpen={true}
        planId="ATLETA_PRO"
        cycle="MONTHLY"
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText(/Pagar com Pix Instantâneo/i));

    await waitFor(() => {
      expect(screen.getByAltText('QR Code Pix')).toBeInTheDocument();
      expect(screen.getByText(/Copiar Código Pix/i)).toBeInTheDocument();
    });
  });

  it('permite alternar para aba de Cartão Recorrente e direcionar para checkout Asaas', async () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { subscriptionId: 'sub_card_ok', invoiceUrl: 'https://asaas.com/i/test-card' },
      }),
    } as any);

    render(
      <CheckoutModal isOpen={true} planId="ATLETA_PRO" cycle="MONTHLY" onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    fireEvent.click(screen.getByText(/Cartão Recorrente/i));
    expect(screen.getByText(/Checkout Seguro Direto no Asaas/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/Ir para Pagamento Seguro no Asaas ➔/i));

    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalledWith('https://asaas.com/i/test-card', '_blank', 'noopener,noreferrer');
      expect(screen.getByText(/Página de pagamento aberta no Asaas/i)).toBeInTheDocument();
      expect(screen.getByText(/Reabrir Página do Asaas ↗/i)).toBeInTheDocument();
    });

    windowOpenSpy.mockRestore();
  });
});
