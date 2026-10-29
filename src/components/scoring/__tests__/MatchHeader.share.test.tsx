/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchHeader } from '../MatchHeader';

describe('MatchHeader - Botão de Compartilhar Transmissão', () => {
  it('deve renderizar o botão de compartilhar e chamar onShare ao ser clicado', () => {
    const handleShare = jest.fn();
    const handleClose = jest.fn();

    render(
      <MatchHeader
        onClose={handleClose}
        onShare={handleShare}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /compartilhar transmissão/i });
    expect(shareBtn).toBeInTheDocument();

    fireEvent.click(shareBtn);
    expect(handleShare).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('não deve exibir o botão de compartilhar quando onShare não é fornecido', () => {
    render(<MatchHeader onClose={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /compartilhar transmissão/i })).not.toBeInTheDocument();
  });
});

