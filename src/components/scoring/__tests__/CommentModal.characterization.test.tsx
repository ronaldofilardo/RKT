/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentModal } from '../CommentModal';

jest.mock('@/hooks/useNotesModal', () => ({
  useNotesModal: jest.fn(),
}));

const mockUseNotesModal = require('@/hooks/useNotesModal').useNotesModal;

const mockVoiceRecorder = {
  state: 'idle' as const,
  error: null as string | null,
  durationMs: 0,
  startRecording: jest.fn(),
  stopRecording: jest.fn().mockResolvedValue(null),
  playPreview: jest.fn(),
  clear: jest.fn(),
};

function renderCommentModal(overrides: {
  canSubmit?: boolean;
  saveText?: string;
  onSave?: jest.Mock;
  onClose?: jest.Mock;
  voiceRecorderState?: string;
} = {}) {
  const onSave = overrides.onSave ?? jest.fn();
  const onClose = overrides.onClose ?? jest.fn();

  mockUseNotesModal.mockReturnValue({
    canSubmit: overrides.canSubmit ?? true,
    text: overrides.saveText ?? 'Teste',
    mode: 'text' as const,
    save: jest.fn().mockResolvedValue({ text: overrides.saveText ?? 'Teste', audio: undefined }),
    clear: jest.fn(),
    setText: jest.fn(),
    setMode: jest.fn(),
    voiceRecorder: {
      ...mockVoiceRecorder,
      state: overrides.voiceRecorderState ?? 'idle',
    },
    hasContent: overrides.canSubmit ?? true,
    maxChars: 500,
  });

  return render(
    <CommentModal
      isOpen
      onClose={onClose}
      onSave={onSave}
    />,
  );
}

describe('CommentModal - comportamento ao enviar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe feedback visual de salvamento e fecha modal automaticamente após salvar', async () => {
    let saved = false;
    const onSave = jest.fn(
      async () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            saved = true;
            resolve();
          }, 50);
        }),
    );
    const onClose = jest.fn();

    renderCommentModal({ onSave, onClose });

    const submitBtn = screen.getByRole('button', { name: /Enviar Comentário/i });
    fireEvent.click(submitBtn);

    // Feedback visual deve aparecer imediatamente bloqueando interações
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Salvando comentário.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 2000 });

    expect(saved).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onSave com os parâmetros corretos após clicar em Enviar Comentário', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    renderCommentModal({ onSave, onClose });

    const submitBtn = screen.getByRole('button', { name: /Enviar Comentário/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    }, { timeout: 2000 });

    expect(onSave).toHaveBeenCalledWith('Teste', undefined);
  });

  it('fecha modal automaticamente após onSave concluir mesmo quando demorado', async () => {
    const onSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 300);
        }),
    );
    const onClose = jest.fn();

    renderCommentModal({ onSave, onClose });

    const submitBtn = screen.getByRole('button', { name: /Enviar Comentário/i });
    fireEvent.click(submitBtn);

    // Modal está salvando
    expect(screen.getByText(/Salvando comentário.../i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });

  it('não chama onSave quando canSubmit é false', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();

    mockUseNotesModal.mockReturnValue({
      canSubmit: false,
      save: jest.fn(),
      clear: jest.fn(),
      setText: jest.fn(),
      setMode: jest.fn(),
      voiceRecorder: mockVoiceRecorder,
      hasContent: false,
      maxChars: 500,
    });

    render(<CommentModal isOpen onClose={onClose} onSave={onSave} />);

    const submitBtn = screen.getByRole('button', { name: /Enviar Comentário/i });
    expect(submitBtn).toBeDisabled();
    fireEvent.click(submitBtn);

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
