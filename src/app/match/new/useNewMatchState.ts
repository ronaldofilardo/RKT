import { useEffect, useRef, useState } from 'react';
import type { Athlete } from './types';
import { ensureAuthCookie } from '@/lib/auth-client';
import { useTournamentSuggestions } from './hooks/useTournamentSuggestions';

export function useNewMatchState() {
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [player1DropdownOpen, setPlayer1DropdownOpen] = useState(false);
  const [player2DropdownOpen, setPlayer2DropdownOpen] = useState(false);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [newAthleteFor, setNewAthleteFor] = useState<'p1' | 'p2' | null>(null);
  const [selectedP1, setSelectedP1] = useState<Athlete | null>(null);
  const [selectedP2, setSelectedP2] = useState<Athlete | null>(null);
  const [format, setFormat] = useState('BEST_OF_3');
  const [courtType, setCourtType] = useState('CLAY');
  const [sportType, setSportType] = useState('TENNIS');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [nickname] = useState('');
  const [visibility, setVisibility] = useState('PLAYERS_ONLY');
  const [anotadorEmail, setAnotadorEmail] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [clubName, setClubName] = useState('');
  const [category, setCategory] = useState<'INFANTIL' | 'JUVENIL' | 'ADULTO' | 'VETERANO' | ''>('');
  const [roundName, setRoundName] = useState('');
  const bracketType = '' as const;
  const [venueId, setVenueId] = useState('');
  const [publicMatchCode, setPublicMatchCode] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [tags, setTags] = useState('');
  const [openForAnnotation, setOpenForAnnotation] = useState(false);
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);
  const tournamentSuggestions = useTournamentSuggestions(tournamentName);
  const [showServerModal, setShowServerModal] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [startingMatch, setStartingMatch] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; playerP1?: string; playerP2?: string } | null>(null);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    setDate((previous) => previous || today);
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem('user_role');
    if (role === 'ADMIN') {
      setVisibility('PUBLIC');
      setOpenForAnnotation(true);
    }
    ensureAuthCookie();
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const userId = sessionStorage.getItem('user_id');
    if (!userId || !token) return;
    fetch(`/api/players?userId=${encodeURIComponent(userId)}`, { headers: { authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((json: { data?: { players?: Athlete[] }; players?: Athlete[] }) => {
        const players = json?.data?.players ?? json?.players ?? [];
        setAthletes(Array.isArray(players) ? players : []);
      })
      .catch(() => undefined);
  }, []);

  return {
    loading, setLoading, submittingRef, error, setError, missingFields, setMissingFields, athletes,
    player1DropdownOpen, setPlayer1DropdownOpen, player2DropdownOpen, setPlayer2DropdownOpen,
    showNewAthleteModal, setShowNewAthleteModal, newAthleteFor, setNewAthleteFor,
    selectedP1, setSelectedP1, selectedP2, setSelectedP2, format, setFormat, courtType, setCourtType,
    sportType, setSportType, date, setDate, time, setTime, nickname, visibility, setVisibility,
    anotadorEmail, setAnotadorEmail, tournamentName, setTournamentName, clubName, setClubName,
    category, setCategory, roundName, setRoundName, bracketType, venueId, setVenueId,
    publicMatchCode, setPublicMatchCode, temperature, setTemperature, humidity, setHumidity,
    tags, setTags, openForAnnotation, showTournamentDropdown, setShowTournamentDropdown,
    tournamentSuggestions, showServerModal, setShowServerModal, createdMatchId, setCreatedMatchId,
    startingMatch, setStartingMatch, pendingPayload, setPendingPayload, showDuplicateModal,
    setShowDuplicateModal, duplicateInfo, setDuplicateInfo,
  };
}

export type NewMatchState = ReturnType<typeof useNewMatchState>;
