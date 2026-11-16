/**
 * CHARACTERIZATION — EditScoreModal (isConfirming state).
 * Divisão da suíte original EditScoreModal.conversation-fixes.test.ts (409L/23 its);
 * doc original e builders: editScoreModalConversationFixesTestKit.ts.
 */
import { confirmingState, cancelAction } from './editScoreModalConversationFixesTestKit';

describe('Conversa 2026-09-08 - isConfirming state', () => {
  it('isConfirming deve ser false inicialmente', () => {
    const state = confirmingState();
    expect(state.isConfirming).toBe(false);
  });

  it('isConfirming deve ser true durante onConfirm', async () => {
    const state = confirmingState();

    // Durante a execução, isConfirming deve ser true
    const promise = state.confirmCurrentAction();
    expect(state.isConfirming).toBe(true);

    // Após completar, isConfirming deve voltar a false
    await promise;
    expect(state.isConfirming).toBe(false);
  });

  it('cancelCurrentAction deve ser bloqueado quando isConfirming=true', () => {
    const { onCancel, cancelCurrentAction } = cancelAction(true);

    cancelCurrentAction();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancelCurrentAction deve funcionar quando isConfirming=false', () => {
    const { onCancel, cancelCurrentAction } = cancelAction(false);

    cancelCurrentAction();
    expect(onCancel).toHaveBeenCalled();
  });
});
