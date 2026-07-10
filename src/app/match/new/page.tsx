'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import {
  MatchNewHeader,
  SportFormatSection,
  PlayerSelection,
  DateTimeSection,
  MatchDetailsSection,
  NewAthleteModal,
  ServerSelectionModal,
  DuplicateMatchModal,
} from './components';

export interface Athlete {
  id: string;
  name: string;
  gender?: string;
  age?: number;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Record<string, number>;
}

interface DuplicateInfo {
  id: string;
  playerP1?: string;
  playerP2?: string;
}

const REQUIRED_FIELDS = [
  { key: 'sport', label: 'Esporte' },
  { key: 'format', label: 'Modo de Jogo' },
  { key: 'courtType', label: 'Tipo de Quadra' },
  { key: 'player1', label: 'Jogador 1' },
  { key: 'player2', label: 'Jogador 2' },
  { key: 'scheduledDate', label: 'Data' },
  { key: 'scheduledTime', label: 'Horário' },
];

export default function NewMatchPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    fetch('/api/players', {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.players && Array.isArray(data.players)) setAthletes(data.players);
        else if (Array.isArray(data)) setAthletes(data);
      })
      .catch(() => {});
  }, []);

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');

  // Details
  const [nickname, setNickname] = useState('');
  const [visibility, setVisibility] = useState('PLAYERS_ONLY');
  const [apontadorEmail, setApontadorEmail] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [category, setCategory] = useState<'INFANTIL' | 'JUVENIL' | 'ADULTO' | 'VETERANO' | ''>('');
  const [includeLet, setIncludeLet] = useState(true);
  const [roundName, setRoundName] = useState('');
  const [bracketType, setBracketType] = useState<'ELIMINATION' | 'GROUPS' | 'SWISS' | ''>('');
  const [venueId, setVenueId] = useState('');
  const [publicMatchCode, setPublicMatchCode] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [tags, setTags] = useState('');
  const [openForAnnotation, setOpenForAnnotation] = useState(false);

  // Tournament suggestions
  const [tournamentSuggestions, setTournamentSuggestions] = useState<string[]>([]);
  const [roundSuggestions, setRoundSuggestions] = useState<string[]>([]);
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);
  const [showRoundDropdown, setShowRoundDropdown] = useState(false);

  // Server selection modal
  const [showServerModal, setShowServerModal] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [startingMatch, setStartingMatch] = useState(false);

  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  // Duplicate modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);

  // ADMIN defaults
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const role = sessionStorage.getItem('user_role');
    if (role === 'ADMIN') {
      setVisibility('PUBLIC');
      setOpenForAnnotation(true);
    }
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
          setRoundSuggestions(data.rounds ?? []);
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

  const handleSelectRound = (name: string) => {
    setRoundName(name);
    setShowRoundDropdown(false);
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
      if (!res.ok) throw new Error();
      router.push(`/match/${createdMatchId}/scoring`);
    } catch {
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
      apontadorEmail: apontadorEmail || null,
      scheduledAt: date && time ? new Date(`${date}T${time}`).toISOString() : undefined,
      venueId: venueId || null,
      publicMatchCode: publicMatchCode || null,
      tournamentName: tournamentName || null,
      category: category || null,
      includeLet: category === 'JUVENIL' ? includeLet : null,
      roundName: roundName || null,
      bracketType: bracketType || null,
      temperature: temperature ? parseFloat(temperature) : null,
      humidity: humidity ? parseFloat(humidity) : null,
      tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : null,
      ...overrides,
    }),
    [
      sportType, format, courtType, selectedP1, selectedP2, nickname, visibility,
      openForAnnotation, apontadorEmail, date, time, venueId, publicMatchCode,
      tournamentName, category, includeLet, roundName, bracketType, temperature, humidity, tags,
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
      if (!res.ok) throw new Error();
      const match = await res.json();
      setCreatedMatchId(match.id);
      setShowServerModal(true);
      toast({ type: 'success', message: 'Partida criada! Escolha o primeiro sacador.' });
    } catch {
      setError('Erro ao criar partida');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMissingFields([]);

    const missing = validateFields();
    if (missing.length > 0) {
      setMissingFields(missing);
      setError(`Complete os campos obrigatórios: ${missing.join(', ')}`);
      return;
    }

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
        setDuplicateInfo(data.existing ?? null);
        setPendingPayload(payload);
        setShowDuplicateModal(true);
        return;
      }

      if (!res.ok) throw new Error(data.message || 'Erro ao criar partida');

      setCreatedMatchId(data.id);
      setShowServerModal(true);
      toast({ type: 'success', message: 'Partida criada! Escolha o primeiro sacador.' });
    } catch (err) {
      setError('Erro ao criar partida');
      toast({ type: 'error', message: 'Erro ao criar partida' });
    } finally {
      setLoading(false);
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
              <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Torneio</h2>
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

            {/* Categoria */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
              <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Categoria</h2>
              <div className="flex-1 relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'INFANTIL' | 'JUVENIL' | 'ADULTO' | 'VETERANO' | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white text-gray-900"
                >
                  <option value="" className="text-gray-900">Selecione</option>
                  <option value="INFANTIL" className="text-gray-900">Infantil</option>
                  <option value="JUVENIL" className="text-gray-900">Juvenil</option>
                  <option value="ADULTO" className="text-gray-900">Adulto</option>
                  <option value="VETERANO" className="text-gray-900">Veterano</option>
                </select>
                {category === 'JUVENIL' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="let-checkbox"
                      checked={includeLet}
                      onChange={(e) => setIncludeLet(e.target.checked)}
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <label htmlFor="let-checkbox" className="text-sm text-gray-700">
                      Let
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Rodada com auto-complete */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
              <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Rodada</h2>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => {
                    setRoundName(e.target.value);
                    setShowRoundDropdown(true);
                  }}
                  onFocus={() => setShowRoundDropdown(true)}
                  placeholder="Nome da rodada (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white text-gray-900 placeholder-gray-500"
                />
                {showRoundDropdown && roundSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-auto">
                    {roundSuggestions.map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          onClick={() => handleSelectRound(r)}
                          className="w-full text-left px-3 py-3 hover:bg-sky-50 text-sm"
                        >
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <MatchDetailsSection
            visibility={visibility}
            apontadorEmail={apontadorEmail}
            bracketType={bracketType}
            venueId={venueId}
            publicMatchCode={publicMatchCode}
            temperature={temperature}
            humidity={humidity}
            tags={tags}
            onVisibilityChange={setVisibility}
            onApontadorChange={setApontadorEmail}
            onBracketChange={setBracketType}
            onVenueChange={setVenueId}
            onPublicCodeChange={setPublicMatchCode}
            onTemperatureChange={setTemperature}
            onHumidityChange={setHumidity}
            onTagsChange={setTags}
          />

          {/* Opções adicionais */}
          <section className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Opções de Anotação</h2>
                <p className="text-sm text-gray-500">Permitir que outros anotem esta partida</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={openForAnnotation}
                  onChange={(e) => setOpenForAnnotation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !selectedP1 || !selectedP2}
                className="flex-1 bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {loading ? 'Criando...' : 'Iniciar Partida'}
              </button>
            </div>
          </section>
        </form>
      </main>

      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => {
          setShowNewAthleteModal(false);
          setNewAthleteFor(null);
        }}
        onCreated={handleAthleteCreated}
      />

      <ServerSelectionModal
        isOpen={showServerModal}
        selectedP1={selectedP1}
        selectedP2={selectedP2}
        startingMatch={startingMatch}
        onSelectServer={handleSelectServer}
        onClose={() => {
          if (!startingMatch) {
            setShowServerModal(false);
            setCreatedMatchId(null);
          }
        }}
      />

      <DuplicateMatchModal
        isOpen={showDuplicateModal}
        existingMatch={duplicateInfo}
        onGoToMatch={(id) => router.push(`/match/${id}/scoring`)}
        onForceCreate={handleForceCreate}
        onCancel={() => {
          setShowDuplicateModal(false);
          setDuplicateInfo(null);
          setPendingPayload(null);
        }}
      />
    </div>
  );
}