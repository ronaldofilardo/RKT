import type { FormEvent } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { logger } from '@/lib/logger';
import type { NewMatchState } from './useNewMatchState';
import { createMatchRequest } from './new-match-submit.helpers';
import { buildMatchPayload } from './build-match-payload.helpers';
import { saveOfflineIfNeeded } from './offline-match.helpers';
import { submitOnlineMatch } from './online-match-submit.helpers';

export function useNewMatchSubmissionActions(
  state: NewMatchState,
  router: ReturnType<typeof useRouter>,
  toast: ReturnType<typeof useToast>['toast'],
) {
  const buildPayload = useCallback((overrides?: Record<string, unknown>) => buildMatchPayload({
    sportType: state.sportType, format: state.format, courtType: state.courtType,
    player1Id: state.selectedP1?.id, player2Id: state.selectedP2?.id,
    nickname: state.nickname, visibility: state.visibility, openForAnnotation: state.openForAnnotation,
    anotadorEmail: state.anotadorEmail, date: state.date, time: state.time, venueId: state.venueId,
    publicMatchCode: state.publicMatchCode, tournamentName: state.tournamentName, clubName: state.clubName,
    category: state.category, roundName: state.roundName, bracketType: state.bracketType,
    temperature: state.temperature, humidity: state.humidity, tags: state.tags,
  }, overrides), [state]);

  const validateFields = useCallback((): string[] => {
    const missing: string[] = [];
    if (!state.sportType) missing.push('Esporte');
    if (!state.format) missing.push('Modo de Jogo');
    if (state.sportType === 'TENNIS' && !state.courtType) missing.push('Tipo de Quadra');
    if (!state.selectedP1) missing.push('Jogador 1');
    if (!state.selectedP2) missing.push('Jogador 2');
    if (!state.date) missing.push('Data');
    if (!state.time) missing.push('Horário');
    return missing;
  }, [state.sportType, state.format, state.courtType, state.selectedP1, state.selectedP2, state.date, state.time]);

  const handleForceCreate = async () => {
    if (!state.pendingPayload || state.submittingRef.current) return;
    state.submittingRef.current = true;
    state.setShowDuplicateModal(false);
    state.setLoading(true);
    state.setError(null);
    try {
      const { response, data: match } = await createMatchRequest(state.pendingPayload, true);
      if (!response.ok) throw new Error(match.message || 'Erro ao criar partida');
      state.setCreatedMatchId(match.data.id);
      state.setShowServerModal(true);
      toast({ type: 'success', message: 'Partida criada! Escolha o primeiro sacador.' });
    } catch (err) {
      logger.error('[handleForceCreate] Error:', err);
      state.setError('Erro ao criar partida');
      toast({ type: 'error', message: 'Erro ao criar partida' });
    } finally {
      state.setLoading(false);
      state.submittingRef.current = false;
    }
  };

  const handleSubmit = async (event: FormEvent) => {
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
      state.setCreatedMatchId(result.data.data.id);
      state.setShowServerModal(true);
      toast({ type: 'success', message: 'Partida criada! Escolha o primeiro sacador.' });
    } catch (err) {
      state.setError('Erro ao criar partida');
      toast({ type: 'error', message: 'Erro ao criar partida' });
    } finally {
      state.setLoading(false);
      state.submittingRef.current = false;
    }
  };

  return { buildPayload, validateFields, handleForceCreate, handleSubmit };
}
