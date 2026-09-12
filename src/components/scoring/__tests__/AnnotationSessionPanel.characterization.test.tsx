/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnotationSessionPanel } from '../AnnotationSessionPanel';

jest.mock('@/services/annotationSessionService', () => ({
  listSessions: jest.fn().mockResolvedValue([]),
}));

describe('AnnotationSessionPanel Characterization', () => {
  const defaultProps = {
    sessionId: 'session-12345678',
    matchId: 'match-1',
    isActive: true,
    onStart: jest.fn(),
    onPause: jest.fn(),
    onEnd: jest.fn(),
    annotatorCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna null quando sessionId é nulo', () => {
    const { container } = render(<AnnotationSessionPanel {...defaultProps} sessionId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza status ao vivo e aciona pausa ao clicar no botão', () => {
    render(<AnnotationSessionPanel {...defaultProps} />);

    expect(screen.getByText(/AO VIVO/i)).toBeInTheDocument();
    expect(screen.getByText(/Sessão: session-/i)).toBeInTheDocument();

    const pauseBtn = screen.getByRole('button', { name: /Pausar/i });
    fireEvent.click(pauseBtn);

    expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
  });

  it('renderiza status pausado e botão de retomar quando isActive é false', () => {
    render(<AnnotationSessionPanel {...defaultProps} isActive={false} />);

    expect(screen.getByText(/PAUSADA/i)).toBeInTheDocument();

    const resumeBtn = screen.getByRole('button', { name: /Retomar/i });
    fireEvent.click(resumeBtn);

    expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
  });
});
