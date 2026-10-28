import { useEffect, useRef, useState } from 'react';
import type { Athlete } from './types';
import { ensureAuthCookie } from '@/lib/auth-client';
import { useTournamentSuggestions } from './hooks/useTournamentSuggestions';
import { loadAvailableCts, type CtOption } from './match-new-ct-logic';
export function useNewMatchState() {
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [matchType, setMatchType] = useState<'SINGLES' | 'DOUBLES'>('SINGLES');
  const [player1DropdownOpen, setPlayer1DropdownOpen] = useState(false);
  const [player2DropdownOpen, setPlayer2DropdownOpen] = useState(false);
  const [player1PartnerDropdownOpen, setPlayer1PartnerDropdownOpen] = useState(false);
  const [player2PartnerDropdownOpen, setPlayer2PartnerDropdownOpen] = useState(false);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [newAthleteFor, setNewAthleteFor] = useState<'p1' | 'p2' | 'p1Partner' | 'p2Partner' | null>(null);
  const [selectedP1, setSelectedP1] = useState<Athlete | null>(null);
  const [selectedP2, setSelectedP2] = useState<Athlete | null>(null);
  const [selectedP1Partner, setSelectedP1Partner] = useState<Athlete | null>(null);
  const [selectedP2Partner, setSelectedP2Partner] = useState<Athlete | null>(null);
  const [doublesSetup, setDoublesSetup] = useState<any | null>(null);
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
  const [details, setDetails] = useState('');
  const [openForAnnotation, setOpenForAnnotation] = useState(false);
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);
  const tournamentSuggestions = useTournamentSuggestions(tournamentName);
  const [showServerModal, setShowServerModal] = useState(false); const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [startingMatch, setStartingMatch] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; playerP1?: string; playerP2?: string; matchType?: 'SINGLES' | 'DOUBLES'; scheduledAt?: Date | string | null } | null>(null);
  const [myClub, setMyClub] = useState(false);
  const [ctId, setCtId] = useState(''); const [clubNameMatch, setClubNameMatch] = useState('');
  const [availableCts, setAvailableCts] = useState<CtOption[]>([]);
  useEffect(() => {
    const role = sessionStorage.getItem('user_role');
    if (role === 'ADMIN') {
      setVisibility('PUBLIC');
      setOpenForAnnotation(true);
    }
    ensureAuthCookie();
  }, []);
  useEffect(() => {
    loadAvailableCts().then(setAvailableCts).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (typeof fetch !== 'function') return;
    const headers: Record<string, string> = {};
    fetch('/api/players?limit=100', { headers })
      .then((response) => response.json())
      .then((json: { data?: { players?: Athlete[] }; players?: Athlete[] }) => {
        const players = json?.data?.players ?? json?.players ?? [];
        setAthletes(Array.isArray(players) ? players : []);
      })
      .catch(() => undefined);
  }, []);
  return {
    loading, setLoading, submittingRef, error, setError, missingFields, setMissingFields, athletes, setAthletes,
    matchType, setMatchType,
    player1DropdownOpen, setPlayer1DropdownOpen, player2DropdownOpen, setPlayer2DropdownOpen,
    player1PartnerDropdownOpen, setPlayer1PartnerDropdownOpen, player2PartnerDropdownOpen, setPlayer2PartnerDropdownOpen,
    showNewAthleteModal, setShowNewAthleteModal, newAthleteFor, setNewAthleteFor,
    selectedP1, setSelectedP1, selectedP2, setSelectedP2,
    selectedP1Partner, setSelectedP1Partner, selectedP2Partner, setSelectedP2Partner,
    doublesSetup, setDoublesSetup, format, setFormat, courtType, setCourtType,
    sportType, setSportType, date, setDate, time, setTime, nickname, visibility, setVisibility,
    anotadorEmail, setAnotadorEmail, tournamentName, setTournamentName, clubName, setClubName,
    category, setCategory, roundName, setRoundName, bracketType, venueId, setVenueId,
    publicMatchCode, setPublicMatchCode, temperature, setTemperature, humidity, setHumidity,
    tags, setTags, details, setDetails, openForAnnotation, showTournamentDropdown, setShowTournamentDropdown,
    tournamentSuggestions, showServerModal, setShowServerModal, createdMatchId, setCreatedMatchId,
    startingMatch, setStartingMatch, pendingPayload, setPendingPayload, showDuplicateModal,
    setShowDuplicateModal, duplicateInfo, setDuplicateInfo,
    myClub, setMyClub, ctId, setCtId, clubNameMatch, setClubNameMatch, availableCts, setAvailableCts,
  };
}
export type NewMatchState = ReturnType<typeof useNewMatchState>;
