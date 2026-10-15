'use client';

import {
  MatchNewHeader,
  SportFormatSection,
  PlayerSelection,
  DateTimeSection,
  MatchDetailsSection,
} from './components';
import { useNewMatchController } from './useNewMatchController';
import { MatchNewErrorBanner } from './MatchNewErrorBanner';
import { TournamentSection } from './TournamentSection';
import { MatchNewModals } from './MatchNewModals';

export default function NewMatchPage() {
  const c = useNewMatchController();

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary safe-top safe-bottom">
      <MatchNewHeader />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <MatchNewErrorBanner error={c.error} missingFields={c.missingFields} />

        <form onSubmit={c.handleSubmit} className="space-y-3">
          <SportFormatSection
            sportType={c.sportType}
            format={c.format}
            courtType={c.courtType}
            onSportChange={c.setSportType}
            onFormatChange={c.setFormat}
            onCourtChange={c.setCourtType}
          />

          <PlayerSelection
            athletes={c.athletes}
            selectedP1={c.selectedP1}
            selectedP2={c.selectedP2}
            player1DropdownOpen={c.player1DropdownOpen}
            player2DropdownOpen={c.player2DropdownOpen}
            onToggleP1={() => c.setPlayer1DropdownOpen(!c.player1DropdownOpen)}
            onToggleP2={() => c.setPlayer2DropdownOpen(!c.player2DropdownOpen)}
            onSelectP1={(a) => c.handleSelectAthlete('p1', a)}
            onSelectP2={(a) => c.handleSelectAthlete('p2', a)}
            onCreateNewP1={() => c.handleOpenNewAthleteModal('p1')}
            onCreateNewP2={() => c.handleOpenNewAthleteModal('p2')}
          />

          <DateTimeSection date={c.date} time={c.time} onDateChange={c.setDate} onTimeChange={c.setTime} />

          <TournamentSection
            tournamentName={c.tournamentName}
            setTournamentName={c.setTournamentName}
            showTournamentDropdown={c.showTournamentDropdown}
            setShowTournamentDropdown={c.setShowTournamentDropdown}
            tournamentSuggestions={c.tournamentSuggestions}
            handleSelectTournament={c.handleSelectTournament}
            clubName={c.clubName}
            setClubName={c.setClubName}
            category={c.category}
            setCategory={c.setCategory}
            setRoundName={c.setRoundName}
          />

          <MatchDetailsSection
            visibility={c.visibility}
            anotadorEmail={c.anotadorEmail}
            venueId={c.venueId}
            publicMatchCode={c.publicMatchCode}
            temperature={c.temperature}
            humidity={c.humidity}
            tags={c.tags}
            details={c.details}
            onVisibilityChange={c.setVisibility}
            onAnotadorChange={c.setAnotadorEmail}
            onVenueChange={c.setVenueId}
            onPublicCodeChange={c.setPublicMatchCode}
            onTemperatureChange={c.setTemperature}
            onHumidityChange={c.setHumidity}
            onTagsChange={c.setTags}
            onDetailsChange={c.setDetails}
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
              disabled={c.loading}
              className="flex-1 px-4 py-3 bg-telemetry-blue text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {c.loading ? 'Criando...' : 'Criar Partida'}
            </button>
          </div>
        </form>
      </main>

      <MatchNewModals
        router={c.router}
        showNewAthleteModal={c.showNewAthleteModal}
        setShowNewAthleteModal={c.setShowNewAthleteModal}
        handleAthleteCreated={c.handleAthleteCreated}
        showServerModal={c.showServerModal}
        setShowServerModal={c.setShowServerModal}
        selectedP1={c.selectedP1}
        selectedP2={c.selectedP2}
        startingMatch={c.startingMatch}
        handleSelectServer={c.handleSelectServer}
        showDuplicateModal={c.showDuplicateModal}
        setShowDuplicateModal={c.setShowDuplicateModal}
        duplicateInfo={c.duplicateInfo}
        handleForceCreate={c.handleForceCreate}
      />
    </div>
  );
}
