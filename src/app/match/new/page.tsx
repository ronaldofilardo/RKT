'use client';

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
import { useNewMatchController } from './useNewMatchController';

export default function NewMatchPage() {
  const {
    router,
    loading,
    error,
    missingFields,
    athletes,
    player1DropdownOpen,
    player2DropdownOpen,
    showNewAthleteModal,
    selectedP1,
    selectedP2,
    format,
    setFormat,
    courtType,
    setCourtType,
    sportType,
    setSportType,
    date,
    setDate,
    time,
    setTime,
    visibility,
    setVisibility,
    anotadorEmail,
    setAnotadorEmail,
    tournamentName,
    setTournamentName,
    clubName,
    setClubName,
    category,
    setCategory,
    setRoundName,
    venueId,
    setVenueId,
    publicMatchCode,
    setPublicMatchCode,
    temperature,
    setTemperature,
    humidity,
    setHumidity,
    tags,
    setTags,
    showTournamentDropdown,
    setShowTournamentDropdown,
    tournamentSuggestions,
    showServerModal,
    setShowServerModal,
    startingMatch,
    showDuplicateModal,
    setShowDuplicateModal,
    duplicateInfo,
    setPlayer1DropdownOpen,
    setPlayer2DropdownOpen,
    setShowNewAthleteModal,
    handleSelectTournament,
    handleOpenNewAthleteModal,
    handleSelectAthlete,
    handleAthleteCreated,
    handleSelectServer,
    handleForceCreate,
    handleSubmit,
  } = useNewMatchController();

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary safe-top safe-bottom">
      <MatchNewHeader />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-sm rounded-lg flex items-start gap-2">
            <span className="text-telemetry-alert mt-0.5">⚠️</span>
            <div>
              <p className="font-medium">Erro</p>
              <p>{error}</p>
              {missingFields.length > 0 && (
                <ul className="mt-1 text-xs text-telemetry-alert list-disc list-inside opacity-90">
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
          <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
                Torneio <span className="text-telemetry-text-muted font-normal">(opcional)</span>
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
                  className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt text-base bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
                />
                {showTournamentDropdown && tournamentSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-telemetry-card border border-white/10 rounded-lg mt-1 shadow-lg max-h-48 overflow-auto">
                    {tournamentSuggestions.map((t) => (
                      <li key={t}>
                        <button
                          type="button"
                          onClick={() => handleSelectTournament(t)}
                          className="w-full text-left px-3 py-3 hover:bg-telemetry-elevated text-sm text-telemetry-text-primary"
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
              <h2 className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
                Clube <span className="text-telemetry-text-muted font-normal">(opcional)</span>
              </h2>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Nome do clube"
                className="flex-1 px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt text-base bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
              />
            </div>

            {/* Rodada */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
              <h2 className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
                Rodada <span className="text-telemetry-text-muted font-normal">(opcional)</span>
              </h2>
              <div className="flex-1 relative">
                <RoundSelector
                  value={category}
                  onChange={(val) => {
                    setCategory(val as 'INFANTIL' | 'JUVENIL' | 'ADULTO' | 'VETERANO' | '');
                    setRoundName(val);
                  }}
                  placeholder="Selecione a rodada"
                />
              </div>
            </div>
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
              className="flex-1 px-4 py-3 bg-transparent border border-white/10 text-telemetry-text-muted font-semibold rounded-lg hover:bg-white/5 hover:text-telemetry-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-telemetry-blue text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
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