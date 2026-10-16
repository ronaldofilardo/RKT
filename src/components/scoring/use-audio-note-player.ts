'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { matchesClient } from '@/services/matchesClient';

interface UseAudioNotePlayerOptions {
  matchId: string;
  pointId?: string;
  commentId?: string;
  token?: string | null;
}

export function useAudioNotePlayer({ matchId, pointId, commentId, token }: UseAudioNotePlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

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

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const audioBlob = await matchesClient.getAudio(matchId, {
        pointId,
        commentId,
        token,
        signal: controller.signal,
      });

      const url = URL.createObjectURL(audioBlob);
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
      if (controller.signal.aborted) return;
      stopPlayback();
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [matchId, pointId, commentId, token, isPlaying, stopPlayback]);

  return { isPlaying, isLoading, handlePlay };
}
