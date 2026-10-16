'use client';

interface TournamentAutocompleteInputProps {
  tournamentName: string;
  setTournamentName: (v: string) => void;
  showTournamentDropdown: boolean;
  setShowTournamentDropdown: (v: boolean) => void;
  tournamentSuggestions: string[];
  handleSelectTournament: (t: string) => void;
}

export function TournamentAutocompleteInput({
  tournamentName,
  setTournamentName,
  showTournamentDropdown,
  setShowTournamentDropdown,
  tournamentSuggestions,
  handleSelectTournament,
}: TournamentAutocompleteInputProps) {
  return (
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
  );
}
