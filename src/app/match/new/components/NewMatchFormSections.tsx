'use client';

import { SportFormatSection, PlayerSelection, DateTimeSection, MatchDetailsSection } from './index';
import { TournamentSection } from './TournamentSection';
import { MatchFormActions } from './MatchFormActions';
import type { Athlete } from '../types';

type NewMatchFormSectionsProps = {
  sportType: string; format: string; courtType: string; athletes: Athlete[]; selectedP1: Athlete | null; selectedP2: Athlete | null;
  player1DropdownOpen: boolean; player2DropdownOpen: boolean; date: string; time: string; tournamentName: string; tournamentSuggestions: string[];
  showTournamentDropdown: boolean; clubName: string; category: string; roundName: string; visibility: string; anotadorEmail: string; venueId: string;
  publicMatchCode: string; temperature: string; humidity: string; tags: string; loading: boolean;
  onSportChange: (value: string) => void; onFormatChange: (value: string) => void; onCourtChange: (value: string) => void;
  onToggleP1: () => void; onToggleP2: () => void; onSelectP1: (athlete: Athlete | null) => void; onSelectP2: (athlete: Athlete | null) => void;
  onCreateNewP1: () => void; onCreateNewP2: () => void; onDateChange: (value: string) => void; onTimeChange: (value: string) => void;
  onTournamentChange: (value: string) => void; onTournamentFocus: () => void; onSelectTournament: (value: string) => void; onClubChange: (value: string) => void; onRoundChange: (value: string) => void;
  onVisibilityChange: (value: string) => void; onAnotadorChange: (value: string) => void; onVenueChange: (value: string) => void; onPublicCodeChange: (value: string) => void; onTemperatureChange: (value: string) => void; onHumidityChange: (value: string) => void; onTagsChange: (value: string) => void;
};

export function NewMatchFormSections(props: NewMatchFormSectionsProps) {
  return <><SportFormatSection sportType={props.sportType} format={props.format} courtType={props.courtType} onSportChange={props.onSportChange} onFormatChange={props.onFormatChange} onCourtChange={props.onCourtChange} /><PlayerSelection athletes={props.athletes} selectedP1={props.selectedP1} selectedP2={props.selectedP2} player1DropdownOpen={props.player1DropdownOpen} player2DropdownOpen={props.player2DropdownOpen} onToggleP1={props.onToggleP1} onToggleP2={props.onToggleP2} onSelectP1={props.onSelectP1} onSelectP2={props.onSelectP2} onCreateNewP1={props.onCreateNewP1} onCreateNewP2={props.onCreateNewP2} /><DateTimeSection date={props.date} time={props.time} onDateChange={props.onDateChange} onTimeChange={props.onTimeChange} /><TournamentSection tournamentName={props.tournamentName} suggestions={props.tournamentSuggestions} showDropdown={props.showTournamentDropdown} clubName={props.clubName} category={props.category} roundName={props.roundName} onTournamentChange={props.onTournamentChange} onTournamentFocus={props.onTournamentFocus} onSelectTournament={props.onSelectTournament} onClubChange={props.onClubChange} onRoundChange={props.onRoundChange} /><MatchDetailsSection visibility={props.visibility} anotadorEmail={props.anotadorEmail} venueId={props.venueId} publicMatchCode={props.publicMatchCode} temperature={props.temperature} humidity={props.humidity} tags={props.tags} onVisibilityChange={props.onVisibilityChange} onAnotadorChange={props.onAnotadorChange} onVenueChange={props.onVenueChange} onPublicCodeChange={props.onPublicCodeChange} onTemperatureChange={props.onTemperatureChange} onHumidityChange={props.onHumidityChange} onTagsChange={props.onTagsChange} /><MatchFormActions loading={props.loading} /></>;
}
