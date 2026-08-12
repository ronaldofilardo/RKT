'use client';

import { useState, useRef, useCallback } from 'react';

interface AudioNotePlayerProps {
  matchId: string;
  pointId: string;
  durationMs?: number;
  token?: string | null;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function AudioNotePlayer({ matchId, pointId, durationMs, token }: AudioNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/matches/${matchId}/point/${pointId}/audio`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        setIsLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        stopPlayback();
      };

      audio.onerror = () => {
        stopPlayback();
      };

      await audio.play();
      setIsPlaying(true);
    } catch {
      stopPlayback();
    } finally {
      setIsLoading(false);
    }
  }, [matchId, pointId, token, isPlaying, stopPlayback]);

  return (
    <button
      onClick={handlePlay}
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
