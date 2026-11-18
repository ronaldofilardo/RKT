'use client';

import { useEffect } from 'react';
import { useCoachEcaOnboarding } from './use-coach-eca-onboarding';
import { CoachEcaTermsModal } from './coach-eca-terms-modal';

interface CoachEcaGuardProps {
  isParticular?: boolean;
}

export function CoachEcaGuard({ isParticular = false }: CoachEcaGuardProps) {
  const { isOpen, checkStatus, acceptTerms, submitting } = useCoachEcaOnboarding(isParticular);

  useEffect(() => {
    if (isParticular) {
      checkStatus();
    }
  }, [isParticular]);

  if (!isOpen) return null;

  return (
    <CoachEcaTermsModal
      isOpen={isOpen}
      onAccept={acceptTerms}
      submitting={submitting}
    />
  );
}
