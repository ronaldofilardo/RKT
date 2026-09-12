/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioNotePlayer } from '../AudioNotePlayer';

describe('AudioNotePlayer Characterization', () => {
  const defaultProps = {
    matchId: 'match-1',
    pointId: 'point-1',
    durationMs: 65000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob([])),
    } as any);

    window.URL.createObjectURL = jest.fn(() => 'blob:mock-audio-url');
    window.URL.revokeObjectURL = jest.fn();
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  it('renderiza o botão com a duração formatada', () => {
    render(<AudioNotePlayer {...defaultProps} />);

    expect(screen.getByRole('button', { name: /1:05/i })).toBeInTheDocument();
    expect(screen.getByTitle('Nota de voz (1:05)')).toBeInTheDocument();
  });

  it('inicia busca de áudio ao clicar no botão de reproduzir', async () => {
    render(<AudioNotePlayer {...defaultProps} />);

    const playBtn = screen.getByRole('button', { name: /1:05/i });
    fireEvent.click(playBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches/match-1/point/point-1/audio',
        expect.objectContaining({ headers: {} })
      );
    });
  });
});
