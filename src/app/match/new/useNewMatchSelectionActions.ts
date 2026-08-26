import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { logger } from '@/lib/logger';
import type { Athlete } from './types';
import type { NewMatchState } from './useNewMatchState';
import { startMatch } from './start-match.helpers';

type SelectionDependencies = Pick<NewMatchState,
  'setTournamentName' | 'setShowTournamentDropdown' | 'setNewAthleteFor' |
  'setShowNewAthleteModal' | 'setSelectedP1' | 'setPlayer1DropdownOpen' |
  'setSelectedP2' | 'setPlayer2DropdownOpen' | 'newAthleteFor' |
  'setShowServerModal' | 'createdMatchId' | 'setStartingMatch' | 'setCreatedMatchId'
>;

export function useNewMatchSelectionActions(
  state: SelectionDependencies,
  router: ReturnType<typeof useRouter>,
  toast: ReturnType<typeof useToast>['toast'],
) {
  const handleSelectTournament = (name: string) => {
    state.setTournamentName(name);
    state.setShowTournamentDropdown(false);
  };

  const handleOpenNewAthleteModal = (player: 'p1' | 'p2') => {
    state.setNewAthleteFor(player);
    state.setShowNewAthleteModal(true);
  };

  const handleSelectAthlete = (player: 'p1' | 'p2', athlete: Athlete | null) => {
    const isPlayerOne = player === 'p1';
    (isPlayerOne ? state.setSelectedP1 : state.setSelectedP2)(athlete);
    (isPlayerOne ? state.setPlayer1DropdownOpen : state.setPlayer2DropdownOpen)(false);
  };

  const handleAthleteCreated = (athlete: Athlete) => {
    handleSelectAthlete(state.newAthleteFor === 'p1' ? 'p1' : 'p2', athlete);
    state.setShowNewAthleteModal(false);
    state.setNewAthleteFor(null);
  };

  const handleSelectServer = async (serverId: string) => {
    if (!state.createdMatchId) return;
    state.setStartingMatch(true);
    try {
      await startMatch(state.createdMatchId, serverId);
      router.push(`/match/${state.createdMatchId}/scoring`);
    } catch (err) {
      logger.error('[handleSelectServer] Exception:', err);
      toast({ type: 'error', message: 'Erro ao iniciar partida' });
      state.setStartingMatch(false);
    }
  };

  return { handleSelectTournament, handleOpenNewAthleteModal, handleSelectAthlete, handleAthleteCreated, handleSelectServer };
}
