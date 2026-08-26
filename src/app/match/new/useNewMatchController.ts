'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useNewMatchState } from './useNewMatchState';
import { useNewMatchSelectionActions } from './useNewMatchSelectionActions';
import { useNewMatchSubmissionActions } from './useNewMatchSubmissionActions';

export function useNewMatchController() {
  const router = useRouter();
  const { toast } = useToast();
  const state = useNewMatchState();
  const selectionActions = useNewMatchSelectionActions(state, router, toast);
  const submissionActions = useNewMatchSubmissionActions(state, router, toast);

  return {
    router,
    toast,
    ...state,
    ...selectionActions,
    ...submissionActions,
  };
}
