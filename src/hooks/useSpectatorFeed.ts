'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SpectatorView, SpectatorFeedStatus, SpectatorRhythmState, SpectatorCorrectionAlert } from '@/core/spectate';
import { diffFeedViews } from '@/core/spectate';

const MAX_SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 horas

export function useSpectatorFeed(matchId: string) {
  const [view, setView] = useState<SpectatorView | null>(null);
  const [status, setStatus] = useState<SpectatorFeedStatus>('LIVE');
  const [ageSeconds, setAgeSeconds] = useState<number | null>(null);
  const [rhythm, setRhythm] = useState<SpectatorRhythmState | null>(null);
  const [correctionAlert, setCorrectionAlert] = useState<SpectatorCorrectionAlert | null>(null);
  const [isClientOffline, setIsClientOffline] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const revRef = useRef<string>('');
  const viewRef = useRef<SpectatorView | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!navigator.onLine) return setIsClientOffline(true);
    if (Date.now() - startTimeRef.current > MAX_SESSION_DURATION_MS) return setIsSessionExpired(true);

    try {
      const url = `/api/spectate/${matchId}/feed${revRef.current ? `?rev=${encodeURIComponent(revRef.current)}` : ''}`;
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      if (res.status === 403) return setIsRevoked(true);
      if (res.status === 404) return setIsNotFound(true);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setIsClientOffline(false);
      setStatus(data.status);
      setAgeSeconds(data.signal?.ageSeconds ?? null);
      setRhythm(data.rhythm);
      setLastUpdated(new Date());

      if (data.view) {
        const diff = diffFeedViews(viewRef.current, data.view);
        if (diff.alert) setCorrectionAlert(diff.alert);
        viewRef.current = data.view;
        setView(data.view);
      }
      revRef.current = data.rev;

      if (data.status !== 'FINISHED') {
        timerRef.current = setTimeout(fetchFeed, data.nextPollInMs || 15_000);
      }
    } catch {
      setIsClientOffline(true);
      timerRef.current = setTimeout(fetchFeed, 20_000);
    }
  }, [matchId]);

  const resumeSession = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsSessionExpired(false);
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    fetchFeed();
    const onVis = () => { if (!document.hidden && !isSessionExpired) fetchFeed(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchFeed, isSessionExpired]);

  return {
    view, status, ageSeconds, rhythm, correctionAlert, isRevoked, isNotFound,
    clearCorrectionAlert: () => setCorrectionAlert(null),
    isClientOffline, isSessionExpired, resumeSession, lastUpdated,
  };
}

