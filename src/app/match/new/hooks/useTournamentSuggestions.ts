'use client';

import { useEffect, useState } from 'react';

export function useTournamentSuggestions(tournamentName: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!tournamentName.trim()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/matches/tournament-suggestions?tournamentName=${encodeURIComponent(tournamentName)}`);
        if (response.ok && !cancelled) {
          const data = await response.json();
          setSuggestions(data.tournaments ?? []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [tournamentName]);

  return suggestions;
}
