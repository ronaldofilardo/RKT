'use client';

import { useAudioNotePlayer } from './use-audio-note-player';
import { formatDuration } from './audio-note-player.logic';

interface AudioNotePlayerProps {
  matchId: string;
  pointId?: string;
  commentId?: string;
  durationMs?: number;
  token?: string | null;
}

export function AudioNotePlayer({ matchId, pointId, commentId, durationMs, token }: AudioNotePlayerProps) {
  const { isPlaying, isLoading, startAudioPlayback } = useAudioNotePlayer({ matchId, pointId, commentId, token });

  return (
    <button
      onClick={startAudioPlayback}
      disabled={isLoading}
      className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-800 transition-colors font-semibold"
      title={durationMs ? `Nota de voz (${formatDuration(durationMs)})` : 'Nota de voz'}
    >
      {isLoading ? (
        <span className="animate-spin w-3 h-3 border border-green-600 border-t-transparent rounded-full" />
      ) : isPlaying ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
      🎤
      {durationMs ? <span>{formatDuration(durationMs)}</span> : null}
    </button>
  );
}
