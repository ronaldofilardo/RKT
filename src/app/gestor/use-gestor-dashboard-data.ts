import { useState, useEffect, useCallback } from 'react';
import type { CoachItem, AthleteItem, ClubMatchItem } from './types';
import type { AffiliateAthleteItem } from './affiliates.types';

export function useGestorDashboardData() {
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [athletes, setAthletes] = useState<AthleteItem[]>([]);
  const [matches, setMatches] = useState<ClubMatchItem[]>([]);
  const [externalMatches, setExternalMatches] = useState<ClubMatchItem[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateAthleteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoachesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/coaches', { cache: 'no-store' });
      if (res.ok) { const d = await res.json(); setCoaches(d.items || []); }
    } catch {}
  }, []);

  const fetchAthletesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/athletes', { cache: 'no-store' });
      if (res.ok) { const d = await res.json(); setAthletes(d.items || []); }
    } catch {}
  }, []);

  const fetchMatchesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/matches', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setMatches(d.items || []);
        setExternalMatches(d.externalItems || []);
      }
    } catch {}
  }, []);

  const fetchAffiliatesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/affiliates', { cache: 'no-store' });
      if (res.ok) { const d = await res.json(); setAffiliates(d.items || []); }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([
      fetchCoachesData(),
      fetchAthletesData(),
      fetchMatchesData(),
      fetchAffiliatesData(),
    ]).finally(() => setLoading(false));
  }, [fetchCoachesData, fetchAthletesData, fetchMatchesData, fetchAffiliatesData]);

  return {
    coaches,
    athletes,
    matches,
    externalMatches,
    affiliates,
    loading,
    fetchCoachesData,
    fetchAthletesData,
    fetchMatchesData,
    fetchAffiliatesData,
  };
}
