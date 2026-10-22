import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { logger } from '@/lib/logger';
import type { Athlete } from './types';
import type { NewMatchState } from './useNewMatchState';
import { startMatch } from './start-match.logic';

type SelectionDependencies = Pick<NewMatchState,
  'setTournamentName' | 'setShowTournamentDropdown' | 'setNewAthleteFor' |
  'setShowNewAthleteModal' | 'setSelectedP1' | 'setPlayer1DropdownOpen' |
  'setSelectedP2' | 'setPlayer2DropdownOpen' |
  'setSelectedP1Partner' | 'setPlayer1PartnerDropdownOpen' |
  'setSelectedP2Partner' | 'setPlayer2PartnerDropdownOpen' |
  'newAthleteFor' |
  'setShowServerModal' | 'createdMatchId' | 'setStartingMatch' | 'setCreatedMatchId' |
  'setAthletes'
>;

export function useNewMatchSelectionActions(
  state: SelectionDependencies,
  router: ReturnType<typeof useRouter>,
  toast: ReturnType<typeof useToast>['toast'],
) {
  const selectTournamentFromSuggestions = (name: string) => {
    state.setTournamentName(name);
    state.setShowTournamentDropdown(false);
  };

  const openNewAthleteModal = (player: 'p1' | 'p2' | 'p1Partner' | 'p2Partner') => {
    state.setNewAthleteFor(player);
    state.setShowNewAthleteModal(true);
  };

  const selectAthleteFromList = (
    player: 'p1' | 'p2' | 'p1Partner' | 'p2Partner',
    athlete: Athlete | null,
  ) => {
    if (player === 'p1') {
      state.setSelectedP1(athlete);
      state.setPlayer1DropdownOpen(false);
    } else if (player === 'p2') {
      state.setSelectedP2(athlete);
      state.setPlayer2DropdownOpen(false);
    } else if (player === 'p1Partner') {
      state.setSelectedP1Partner(athlete);
      state.setPlayer1PartnerDropdownOpen(false);
    } else if (player === 'p2Partner') {
      state.setSelectedP2Partner(athlete);
      state.setPlayer2PartnerDropdownOpen(false);
    }
  };

  const onAthleteCreationComplete = (athlete: Athlete) => {
    state.setAthletes((prev) => {
      if (prev.some((a) => a.id === athlete.id)) return prev;
      return [...prev, athlete];
    });
    if (state.newAthleteFor) {
      selectAthleteFromList(state.newAthleteFor, athlete);
    }
    state.setShowNewAthleteModal(false);
    state.setNewAthleteFor(null);
  };

  const selectServingPlayer = async (serverId: string) => {
    if (!state.createdMatchId) return;
    state.setStartingMatch(true);
    try {
      await startMatch(state.createdMatchId, serverId);
      router.push(`/match/${state.createdMatchId}/scoring`);
    } catch (err) {
      logger.error('[selectServingPlayer] Exception:', err);
      toast({ type: 'error', message: 'Erro ao iniciar partida' });
      state.setStartingMatch(false);
    }
  };

  const selectDoublesServingSetup = async (initialServerId: string, doublesSetup: unknown) => {
    if (!state.createdMatchId) return;
    state.setStartingMatch(true);
    try {
      await startMatch(state.createdMatchId, initialServerId, doublesSetup);
      router.push(`/match/${state.createdMatchId}/scoring`);
    } catch (err) {
      logger.error('[selectDoublesServingSetup] Exception:', err);
      toast({ type: 'error', message: 'Erro ao iniciar partida de duplas' });
      state.setStartingMatch(false);
    }
  };

  return {
    selectTournamentFromSuggestions,
    openNewAthleteModal,
    selectAthleteFromList,
    onAthleteCreationComplete,
    selectServingPlayer,
    selectDoublesServingSetup,
  };
}
