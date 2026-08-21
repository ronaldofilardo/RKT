'use client';

import { useState, useRef, useCallback } from 'react';
import { AudioNotePlayerView } from './AudioNotePlayer.view';

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

  return <AudioNotePlayerView isLoading={isLoading} isPlaying={isPlaying} durationMs={durationMs} onPlay={handlePlay} formatDuration={formatDuration} />;
}
