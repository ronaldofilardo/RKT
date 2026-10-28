import type { FormEvent } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import type { NewMatchState } from './useNewMatchState';
import { buildMatchPayload } from './build-match-payload.logic';
import { saveOfflineIfNeeded } from './offline-match.logic';
import { submitOnlineMatch } from './online-match-submit.logic';
import { isMatchScheduledForFuture } from './schedule-check.logic';
import { getMissingFields } from './new-match-validate-fields.logic';
import { createMatchIgnoringWarning, notifyMatchCreated } from './new-match-ignore-warning.logic';

export function useNewMatchSubmissionActions(
  state: NewMatchState,
  router: ReturnType<typeof useRouter>,
  toast: ReturnType<typeof useToast>['toast'],
) {
  const buildPayload = useCallback((overrides?: Record<string, unknown>) => buildMatchPayload({
    sportType: state.sportType, format: state.format, courtType: state.courtType,
    matchType: state.matchType,
    player1Id: state.selectedP1?.id, player2Id: state.selectedP2?.id,
    player1PartnerId: state.selectedP1Partner?.id, player2PartnerId: state.selectedP2Partner?.id,
    doublesSetup: state.doublesSetup,
    nickname: state.nickname, visibility: state.visibility, openForAnnotation: state.openForAnnotation,
    anotadorEmail: state.anotadorEmail, date: state.date, time: state.time, venueId: state.venueId,
    ctId: state.ctId, clubNameMatch: state.clubNameMatch,
    publicMatchCode: state.publicMatchCode, tournamentName: state.tournamentName, clubName: state.clubName,
    category: state.category, roundName: state.roundName, bracketType: state.bracketType,
    temperature: state.temperature, humidity: state.humidity, tags: state.tags, details: state.details,
  }, overrides), [state]);

  const validateFields = useCallback((): string[] => getMissingFields(state), [state]);

  const submitNewMatchForm = async (event: FormEvent) => {
    event.preventDefault();
    if (state.submittingRef.current) return;
    state.setError(null);
    state.setMissingFields([]);
    const missing = validateFields();
    if (missing.length > 0) {
      state.setMissingFields(missing);
      state.setError(`Complete os campos obrigatórios: ${missing.join(', ')}`);
      return;
    }
    state.submittingRef.current = true;
    const payload = buildPayload();
    if (await saveOfflineIfNeeded(navigator.onLine, payload)) {
      toast({ type: 'success', message: 'Partida salva localmente. Será enviada ao reconectar.' });
      router.push('/dashboard');
      return;
    }
    state.setLoading(true);
    try {
      const result = await submitOnlineMatch(payload);
      if (result.duplicate) {
        state.setDuplicateInfo(result.data.details ?? null);
        state.setPendingPayload(payload);
        state.setShowDuplicateModal(true);
        return;
      }
      notifyMatchCreated(isMatchScheduledForFuture(state.date, state.time), toast);
      router.push('/dashboard');
    } catch {
      state.setError('Erro ao criar partida');
      toast({ type: 'error', message: 'Erro ao criar partida' });
    } finally {
      state.setLoading(false);
      state.submittingRef.current = false;
    }
  };

  return {
    buildPayload,
    validateFields,
    createMatchIgnoringWarning: () => createMatchIgnoringWarning(state, router, toast),
    submitNewMatchForm,
  };
}
