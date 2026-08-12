/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecorder } from '../useVoiceRecorder';

const mockGetUserMedia = jest.fn();
const mockMediaRecorderInstances: MockMediaRecorder[] = [];

class MockMediaRecorder {
  state: string = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType: string;

  constructor(public stream: MediaStream, options?: { mimeType: string }) {
    this.mimeType = options?.mimeType ?? '';
    mockMediaRecorderInstances.push(this);
  }

  start(_timeslice?: number) {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }

  static isTypeSupported(_mimeType: string): boolean {
    return true;
  }
}

Object.defineProperty(global, 'MediaRecorder', {
  value: MockMediaRecorder,
  writable: true,
  configurable: true,
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: jest.fn() }],
  });
});

describe('useVoiceRecorder', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useVoiceRecorder());
    expect(result.current.state).toBe('idle');
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.durationMs).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('transitions to recording on startRecording', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('recording');
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('transitions to recorded on stopRecording', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.state).toBe('recorded');
    expect(result.current.audioBlob).toBeInstanceOf(Blob);
    expect(result.current.durationMs).toBeGreaterThanOrEqual(0);

    jest.useRealTimers();
  });

  it('clears state back to idle', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.durationMs).toBe(0);
  });

  it('sets error when getUserMedia fails', async () => {
    mockGetUserMedia.mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'));

    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBe('Permissão de microfone negada');
  });

  it('sets generic error for other failures', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Other'));

    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBe('Erro ao acessar microfone');
  });

  it('sets error when MediaRecorder not supported', async () => {
    const OriginalMR = global.MediaRecorder;
    // @ts-expect-error - intentionally removing global for this test
    delete (global as any).MediaRecorder;

    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toBe('Gravação de áudio não suportada neste navegador');
    (global as any).MediaRecorder = OriginalMR;
  });

  it('cleans up stream on unmount', async () => {
    const stopMock = jest.fn();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: stopMock }],
    });

    const { result, unmount } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    unmount();

    expect(stopMock).toHaveBeenCalled();
  });
});
