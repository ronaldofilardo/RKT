import { useCallback } from 'react';

interface VoiceRecorderPreviewParams {
  audioBlob: Blob | null;
  audioElementRef: React.MutableRefObject<HTMLAudioElement | null>;
  stopPreview: () => void;
}

export function useVoiceRecorderPreview(params: VoiceRecorderPreviewParams) {
  const { audioBlob, audioElementRef, stopPreview } = params;

  const playPreview = useCallback(() => {
    if (!audioBlob) return;

    stopPreview();

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audioElementRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioElementRef.current = null;
    };

    audio.play().catch(() => {
      URL.revokeObjectURL(url);
      audioElementRef.current = null;
    });
  }, [audioBlob, stopPreview, audioElementRef]);

  return { playPreview };
}
