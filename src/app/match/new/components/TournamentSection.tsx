'use client';

import { RoundSelector } from '../components';

type TournamentSectionProps = {
  tournamentName: string;
  suggestions: string[];
  showDropdown: boolean;
  clubName: string;
  category: string;
  roundName: string;
  onTournamentChange: (value: string) => void;
  onTournamentFocus: () => void;
  onSelectTournament: (value: string) => void;
  onClubChange: (value: string) => void;
  onRoundChange: (value: string) => void;
};

export function TournamentSection({ tournamentName, suggestions, showDropdown, clubName, category, onTournamentChange, onTournamentFocus, onSelectTournament, onClubChange, onRoundChange }: TournamentSectionProps) {
  return <section className="bg-white rounded-xl shadow-sm border p-4"><div className="flex flex-col sm:flex-row sm:items-center gap-3"><h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Torneio <span className="text-gray-400 font-normal">(opcional)</span></h2><div className="flex-1 relative"><input type="text" value={tournamentName} onChange={(event) => onTournamentChange(event.target.value)} onFocus={onTournamentFocus} placeholder="Nome do torneio" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white text-gray-900 placeholder-gray-500" />{showDropdown && suggestions.length > 0 && <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-auto">{suggestions.map((suggestion) => <li key={suggestion}><button type="button" onClick={() => onSelectTournament(suggestion)} className="w-full text-left px-3 py-3 hover:bg-sky-50 text-sm">{suggestion}</button></li>)}</ul>}</div></div><div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3"><h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Clube <span className="text-gray-400 font-normal">(opcional)</span></h2><input type="text" value={clubName} onChange={(event) => onClubChange(event.target.value)} placeholder="Nome do clube" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white text-gray-900 placeholder-gray-500" /></div><div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3"><h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Rodada <span className="text-gray-400 font-normal">(opcional)</span></h2><div className="flex-1 relative"><RoundSelector value={category} onChange={onRoundChange} placeholder="Selecione a rodada" /></div></div></section>;
}
