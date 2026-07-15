import { useState, useCallback, useEffect } from 'react';
import type { Athlete } from './page';

interface MatchFormState {
  format: string;
  courtType: string;
  sportType: string;
  date: string;
  time: string;
  nickname: string;
  visibility: string;
  apontadorEmail: string;
  tournamentName: string;
  clubName: string;
  category: string;
  includeLet: boolean;
  roundName: string;
  bracketType: string;
  venueId: string;
  publicMatchCode: string;
  temperature: string;
  humidity: string;
  tags: string;
  openForAnnotation: boolean;
}

export function useMatchForm(initialVisibility?: string) {
  const [form, setForm] = useState<MatchFormState>({
    format: 'BEST_OF_3',
    courtType: 'CLAY',
    sportType: 'TENNIS',
    date: new Date().toISOString().split('T')[0],
    time: '',
    nickname: '',
    visibility: initialVisibility || 'PLAYERS_ONLY',
    apontadorEmail: '',
    tournamentName: '',
    clubName: '',
    category: '',
    includeLet: true,
    roundName: '',
    bracketType: '',
    venueId: '',
    publicMatchCode: '',
    temperature: '',
    humidity: '',
    tags: '',
    openForAnnotation: initialVisibility === 'PUBLIC',
  });

  const updateField = useCallback(<K extends keyof MatchFormState>(
    field: K,
    value: MatchFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      format: 'BEST_OF_3',
      courtType: 'CLAY',
      sportType: 'TENNIS',
      date: new Date().toISOString().split('T')[0],
      time: '',
      nickname: '',
      visibility: 'PLAYERS_ONLY',
      apontadorEmail: '',
      tournamentName: '',
      clubName: '',
      category: '',
      includeLet: true,
      roundName: '',
      bracketType: '',
      venueId: '',
      publicMatchCode: '',
      temperature: '',
      humidity: '',
      tags: '',
      openForAnnotation: false,
    });
  }, []);

  return { form, updateField, resetForm, setForm };
}

export function useAthleteSelection() {
  const [selectedP1, setSelectedP1] = useState<Athlete | null>(null);
  const [selectedP2, setSelectedP2] = useState<Athlete | null>(null);
  const [player1DropdownOpen, setPlayer1DropdownOpen] = useState(false);
  const [player2DropdownOpen, setPlayer2DropdownOpen] = useState(false);

  const handleSelectAthlete = useCallback((player: 'p1' | 'p2', athlete: Athlete | null) => {
    if (player === 'p1') {
      setSelectedP1(athlete);
      setPlayer1DropdownOpen(false);
    } else {
      setSelectedP2(athlete);
      setPlayer2DropdownOpen(false);
    }
  }, []);

  return {
    selectedP1,
    selectedP2,
    player1DropdownOpen,
    player2DropdownOpen,
    setPlayer1DropdownOpen,
    setPlayer2DropdownOpen,
    handleSelectAthlete,
  };
}

export function useAthleteSearch(userId?: string | null) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const token = sessionStorage.getItem('access_token');

    fetch(`/api/players?userId=${userId}`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.players && Array.isArray(data.players)) setAthletes(data.players);
        else if (Array.isArray(data)) setAthletes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  return { athletes, loading };
}

export function useTournamentSuggestions() {
  const [tournamentName, setTournamentName] = useState('');
  const [suggestions, setTournamentSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowTournamentDropdown] = useState(false);

  useEffect(() => {
    if (!tournamentName.trim()) {
      setTournamentSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/matches/tournament-suggestions?tournamentName=${encodeURIComponent(tournamentName)}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTournamentSuggestions(data.tournaments ?? []);
        }
      } catch {}
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tournamentName]);

  const handleSelectTournament = useCallback((name: string) => {
    setTournamentName(name);
    setShowTournamentDropdown(false);
  }, []);

  return {
    tournamentName,
    setTournamentName,
    suggestions,
    showDropdown,
    setShowTournamentDropdown,
    handleSelectTournament,
  };
}