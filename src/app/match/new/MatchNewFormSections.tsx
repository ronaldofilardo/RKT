'use client';

import {
  SportFormatSection,
  PlayerSelection,
  DateTimeSection,
  MatchDetailsSection,
} from './components';
import { TournamentSection } from './TournamentSection';
import { MatchNewFormFooter } from './match-new-form-footer';
import { MyClubToggle } from './components/my-club-toggle';
import type { useNewMatchController } from './useNewMatchController';

type NewMatchController = ReturnType<typeof useNewMatchController>;

export function MatchNewFormSections({ c }: { c: NewMatchController }) {
  return (
    <form onSubmit={c.submitNewMatchForm} className="space-y-3">
      <SportFormatSection
        sportType={c.sportType}
        format={c.format}
        courtType={c.courtType}
        onSportChange={c.setSportType}
        onFormatChange={c.setFormat}
        onCourtChange={c.setCourtType}
      />
      <PlayerSelection
        matchType={c.matchType}
        onMatchTypeChange={c.setMatchType}
        athletes={c.athletes}
        selectedP1={c.selectedP1}
        selectedP2={c.selectedP2}
        selectedP1Partner={c.selectedP1Partner}
        selectedP2Partner={c.selectedP2Partner}
        player1DropdownOpen={c.player1DropdownOpen}
        player2DropdownOpen={c.player2DropdownOpen}
        player1PartnerDropdownOpen={c.player1PartnerDropdownOpen}
        player2PartnerDropdownOpen={c.player2PartnerDropdownOpen}
        onToggleP1={() => c.setPlayer1DropdownOpen(!c.player1DropdownOpen)}
        onToggleP2={() => c.setPlayer2DropdownOpen(!c.player2DropdownOpen)}
        onToggleP1Partner={() => c.setPlayer1PartnerDropdownOpen(!c.player1PartnerDropdownOpen)}
        onToggleP2Partner={() => c.setPlayer2PartnerDropdownOpen(!c.player2PartnerDropdownOpen)}
        onSelectP1={(a) => c.selectAthleteFromList('p1', a)}
        onSelectP2={(a) => c.selectAthleteFromList('p2', a)}
        onSelectP1Partner={(a) => c.selectAthleteFromList('p1Partner', a)}
        onSelectP2Partner={(a) => c.selectAthleteFromList('p2Partner', a)}
        onCreateNewP1={() => c.openNewAthleteModal('p1')}
        onCreateNewP2={() => c.openNewAthleteModal('p2')}
        onCreateNewP1Partner={() => c.openNewAthleteModal('p1Partner')}
        onCreateNewP2Partner={() => c.openNewAthleteModal('p2Partner')}
        myClub={c.myClub}
        ctId={c.ctId || null}
      />
      <MyClubToggle
        myClub={c.myClub}
        setMyClub={c.setMyClub}
        ctId={c.ctId}
        setCtId={c.setCtId}
        availableCts={c.availableCts}
      />
      <DateTimeSection date={c.date} time={c.time} onDateChange={c.setDate} onTimeChange={c.setTime} />
      <TournamentSection
        tournamentName={c.tournamentName}
        setTournamentName={c.setTournamentName}
        showTournamentDropdown={c.showTournamentDropdown}
        setShowTournamentDropdown={c.setShowTournamentDropdown}
        tournamentSuggestions={c.tournamentSuggestions}
        selectTournamentFromSuggestions={c.selectTournamentFromSuggestions}
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
      <MatchNewFormFooter loading={c.loading} />
    </form>
  );
}
