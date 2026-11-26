import { patchUser, patchTrainingCenter } from './suporte-mutations';

interface CreateSuporteActionsParams {
  onRetry: () => void;
  setError: (msg: string) => void;
  closeEditClub: () => void;
}

/** Handlers de mutação do painel de suporte (bloquear/reativar clube, editar usuário/clube). */
export function createSuporteActions({ onRetry, setError, closeEditClub }: CreateSuporteActionsParams) {
  const handleSuspend = async (ctId: string) => {
    try { await patchTrainingCenter(ctId, { status: 'SUSPENDED' }); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao bloquear clube'); }
  };

  const handleReactivate = async (ctId: string) => {
    try { await patchTrainingCenter(ctId, { status: 'ACTIVE' }); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao reativar clube'); }
  };

  const handleEditUser = async (userId: string, val: any) => {
    try { await patchUser(userId, val); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao editar usuário'); }
  };

  const handleEditClub = async (ctId: string, val: any) => {
    try {
      await patchTrainingCenter(ctId, val);
      closeEditClub();
      onRetry();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao editar clube'); }
  };

  return { handleSuspend, handleReactivate, handleEditUser, handleEditClub };
}
