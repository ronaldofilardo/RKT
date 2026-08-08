'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { logger } from '@/lib/logger';
import { ensureAuthCookie } from '@/lib/auth-client';
import {
  MatchNewHeader,
  SportFormatSection,
  PlayerSelection,
  DateTimeSection,
  MatchDetailsSection,
  NewAthleteModal,
  ServerSelectionModal,
  DuplicateMatchModal,
  RoundSelector,
} from './components';
import type { Athlete } from './types';

export default function NewMatchPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  // Player dropdowns
  const [player1DropdownOpen, setPlayer1DropdownOpen] = useState(false);
  const [player2DropdownOpen, setPlayer2DropdownOpen] = useState(false);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [newAthleteFor, setNewAthleteFor] = useState<'p1' | 'p2' | null>(null);

  const [selectedP1, setSelectedP1] = useState<Athlete | null>(null);
  const [selectedP2, setSelectedP2] = useState<Athlete | null>(null);

  // Match config
  const [format, setFormat] = useState('BEST_OF_3');
  const [courtType, setCourtType] = useState('CLAY');
  const [sportType, setSportType] = useState('TENNIS');

  // Date/time
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    setDate(prev => prev || today);
  }, []);

  // Details
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

  // Tournament suggestions
  const [tournamentSuggestions, setTournamentSuggestions] = useState<string[]>([]);
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);

  // Server selection modal
  const [showServerModal, setShowServerModal] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [startingMatch, setStartingMatch] = useState(false);

  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  // Duplicate modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; playerP1?: string; playerP2?: string } | null>(null);

  // ADMIN defaults
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

    fetch(`/api/players?userId=${encodeURIComponent(userId)}`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const players = json?.data?.players ?? json?.players ?? [];
        setAthletes(Array.isArray(players) ? players : []);
      })
      .catch(() => {});
  }, []);

  // Tournament auto-complete
  useEffect(() => {
    if (!tournamentName.trim()) {
      setTournamentSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/matches/tournament-suggestions?tournamentName=${encodeURIComponent(tournamentName)}`,
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

  const handleSelectTournament = (name: string) => {
    setTournamentName(name);
    setShowTournamentDropdown(false);
  };

  const handleOpenNewAthleteModal = (player: 'p1' | 'p2') => {
    setNewAthleteFor(player);
    setShowNewAthleteModal(true);
  };

  const handleSelectAthlete = (player: 'p1' | 'p2', athlete: Athlete | null) => {
    if (player === 'p1') {
      setSelectedP1(athlete);
      setPlayer1DropdownOpen(false);
    } else {
      setSelectedP2(athlete);
      setPlayer2DropdownOpen(false);
    }
  };

  const handleAthleteCreated = (athlete: Athlete) => {
    if (newAthleteFor === 'p1') handleSelectAthlete('p1', athlete);
    else handleSelectAthlete('p2', athlete);
    setShowNewAthleteModal(false);
    setNewAthleteFor(null);
  };

  const handleSelectServer = async (serverId: string) => {
    if (!createdMatchId) return;
    setStartingMatch(true);
    try {
      const accessToken = sessionStorage.getItem('access_token');
      const res = await fetch(`/api/matches/${createdMatchId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ state: 'IN_PROGRESS', initialServerId: serverId }),
      });
      const data = await res.json();
      if (!res.ok) {
        logger.error('[handleSelectServer] Error:', data);
        throw new Error(data?.error || 'Erro ao iniciar partida');
      }
      router.push(`/match/${createdMatchId}/scoring`);
    } catch (err) {
      logger.error('[handleSelectServer] Exception:', err);
      toast({ type: 'error', message: 'Erro ao iniciar partida' });
      setStartingMatch(false);
    }
  };

  const buildPayload = useCallback(
    (overrides?: Record<string, unknown>) => ({
      sportType,
      format,
      courtType: sportType === 'TENNIS' ? courtType : null,
      player1Id: selectedP1?.id,
      player2Id: selectedP2?.id,
      nickname: nickname || null,
      visibility: visibility || 'PLAYERS_ONLY',
      openForAnnotation,
      anotadorEmail: anotadorEmail || null,
      scheduledAt: date && time ? new Date(`${date}T${time}`).toISOString() : undefined,
      venueId: venueId || null,
      publicMatchCode: publicMatchCode || null,
      tournamentName: tournamentName || null,
      clubName: clubName || null,
      category: category || null,
      roundName: roundName || null,
      bracketType: bracketType || null,
      temperature: temperature ? parseFloat(temperature) : null,
      humidity: humidity ? parseFloat(humidity) : null,
      tags: tags || null,
      ...overrides,
    }),
    [
      sportType, format, courtType, selectedP1, selectedP2, nickname, visibility,
      openForAnnotation, anotadorEmail, date, time, venueId, publicMatchCode,
      tournamentName, clubName, category, roundName, temperature, humidity, tags,
    ],
  );

  const validateFields = useCallback((): string[] => {
    const missing: string[] = [];
    if (!sportType) missing.push('Esporte');
    if (!format) missing.push('Modo de Jogo');
    if (sportType === 'TENNIS' && !courtType) missing.push('Tipo de Quadra');
    if (!selectedP1) missing.push('Jogador 1');
    if (!selectedP2) missing.push('Jogador 2');
    if (!date) missing.push('Data');
    if (!time) missing.push('Horário');
    return missing;
  }, [sportType, format, courtType, selectedP1, selectedP2, date, time]);

  const handleForceCreate = async () => {
    if (!pendingPayload) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setShowDuplicateModal(false);
    setLoading(true);
    setError(null);
    try {
      const accessToken = sessionStorage.getItem('access_token');
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...pendingPayload, force: true }),
      });
      const match = await res.json();
      if (!res.ok) throw new Error(match.message || 'Erro ao criar partida');
      setCreatedMatchId(match.data.id);
      setShowServerModal(true);
      toast({ type: 'success', message: 'Partida criada! Escolha o primeiro sacador.' });
    } catch (err) {
      logger.error('[handleForceCreate] Error:', err);
      setError('Erro ao criar partida');
      toast({ type: 'error', message: 'Erro ao criar partida' });
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);
    setMissingFields([]);

    const missing = validateFields();
    if (missing.length > 0) {
      setMissingFields(missing);
      setError(`Complete os campos obrigatórios: ${missing.join(', ')}`);
      return;
    }

    submittingRef.current = true;

    // Offline support
    if (!navigator.onLine) {
      const tempId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { savePendingMatch } = await import('@/lib/offlineDb');
      await savePendingMatch({
        tempId,
        matchData: buildPayload(),
        syncStatus: 'PENDING',
        createdAt: Date.now(),
      });
      toast({ type: 'success', message: 'Partida salva localmente. Será enviada ao reconectar.' });
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    try {
      const accessToken = sessionStorage.getItem('access_token');
      const payload = buildPayload();

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.code === 'DUPLICATE_MATCH') {
        setDuplicateInfo(data.details ?? null);
        setPendingPayload(payload);
        setShowDuplicateModal(true);
        return;
      }

      if (!res.ok) throw new Error(data.message || 'Erro ao criar partida');

      setCreatedMatchId(data.data.id);
      setShowServerModal(true);
      toast({ type: 'success', message: 'Partida criada! Escolha o primeiro sacador.' });
    } catch (err) {
      setError('Erro ao criar partida');
      toast({ type: 'error', message: 'Erro ao criar partida' });
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      <MatchNewHeader />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠️</span>
            <div>
              <p className="font-medium">Erro</p>
              <p>{error}</p>
              {missingFields.length > 0 && (
                <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
                  {missingFields.map((f) => (
                    <li key={f}>Falta: {f}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <SportFormatSection
            sportType={sportType}
            format={format}
            courtType={courtType}
            onSportChange={setSportType}
            onFormatChange={setFormat}
            onCourtChange={setCourtType}
          />

          <PlayerSelection
            athletes={athletes}
            selectedP1={selectedP1}
            selectedP2={selectedP2}
            player1DropdownOpen={player1DropdownOpen}
            player2DropdownOpen={player2DropdownOpen}
            onToggleP1={() => setPlayer1DropdownOpen(!player1DropdownOpen)}
            onToggleP2={() => setPlayer2DropdownOpen(!player2DropdownOpen)}
            onSelectP1={(a) => handleSelectAthlete('p1', a)}
            onSelectP2={(a) => handleSelectAthlete('p2', a)}
            onCreateNewP1={() => handleOpenNewAthleteModal('p1')}
            onCreateNewP2={() => handleOpenNewAthleteModal('p2')}
          />

          <DateTimeSection date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />

          {/* Torneio com auto-complete */}
          <section className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
                Torneio <span className="text-gray-400 font-normal">(opcional)</span>
              </h2>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => {
                    setTournamentName(e.target.value);
                    setShowTournamentDropdown(true);
                  }}
                  onFocus={() => setShowTournamentDropdown(true)}
                  placeholder="Nome do torneio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white text-gray-900 placeholder-gray-500"
                />
                {showTournamentDropdown && tournamentSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-auto">
                    {tournamentSuggestions.map((t) => (
                      <li key={t}>
                        <button
                          type="button"
                          onClick={() => handleSelectTournament(t)}
                          className="w-full text-left px-3 py-3 hover:bg-sky-50 text-sm"
                        >
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Clube */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
              <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
                Clube <span className="text-gray-400 font-normal">(opcional)</span>
              </h2>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Nome do clube"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Rodada */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
              <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
                Rodada <span className="text-gray-400 font-normal">(opcional)</span>
              </h2>
              <div className="flex-1 relative">
                <RoundSelector
                  value={category}
                  onChange={(val) => {
                    setCategory(val as 'INFANTIL' | 'JUVENIL' | 'ADULTO' | 'VETERANO' | '');
                    if (val) setRoundName(val);
                  }}
                  placeholder="Selecione a rodada"
                />
              </div>
            </div>

            {/* Fase - oculta quando rodada já foi selecionada */}
            {!category && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
                  Fase <span className="text-gray-400 font-normal">(opcional)</span>
                </h2>
                <div className="flex-1">
                  <RoundSelector
                    value={roundName}
                    onChange={setRoundName}
                    placeholder="Fase da partida"
                  />
                </div>
              </div>
            )}
          </section>

          <MatchDetailsSection
            visibility={visibility}
            anotadorEmail={anotadorEmail}
            venueId={venueId}
            publicMatchCode={publicMatchCode}
            temperature={temperature}
            humidity={humidity}
            tags={tags}
            onVisibilityChange={setVisibility}
            onAnotadorChange={setAnotadorEmail}
            onVenueChange={setVenueId}
            onPublicCodeChange={setPublicMatchCode}
            onTemperatureChange={setTemperature}
            onHumidityChange={setHumidity}
            onTagsChange={setTags}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Criando...' : 'Criar Partida'}
            </button>
          </div>
        </form>
      </main>

      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={handleAthleteCreated}
      />

      <ServerSelectionModal
        isOpen={showServerModal}
        selectedP1={selectedP1}
        selectedP2={selectedP2}
        startingMatch={startingMatch}
        onSelectServer={handleSelectServer}
        onClose={() => setShowServerModal(false)}
      />

      <DuplicateMatchModal
        isOpen={showDuplicateModal}
        existingMatch={duplicateInfo}
        onGoToMatch={(id) => router.push(`/match/${id}/scoring`)}
        onForceCreate={handleForceCreate}
        onCancel={() => setShowDuplicateModal(false)}
      />
    </div>
  );
}