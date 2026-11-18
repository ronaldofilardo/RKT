'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  buildGuardianProfile,
  goToResponsavelPanel,
  initialMinor,
  togglePurpose,
  validateMinor,
  type ResponsavelAccessMode,
  type ResponsavelMinorForm,
  type ResponsavelPurpose,
  type ResponsavelSignupInput,
} from './responsavel-onboarding-logic';
import { postGuardianSignup, postStaffIndication } from './responsavel-api.logic';
import type { StaffIndicationInput } from '@/schemas/guardian';

export type ResponsavelStep = 1 | 2 | 3;

/** Orquestra as 3 etapas do modal: modo → menor (signup atômico) → equipe técnica. */
export function useResponsavelOnboarding(onSuccess: () => void) {
  const router = useRouter();
  const [step, setStep] = useState<ResponsavelStep>(1);
  const [accessMode, setAccessMode] = useState<ResponsavelAccessMode>('BASIC');
  const [minor, setMinor] = useState<ResponsavelMinorForm>(initialMinor);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [staffIndication, setStaffIndication] = useState<StaffIndicationInput | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMinorField = <K extends keyof ResponsavelMinorForm>(key: K, value: ResponsavelMinorForm[K]) =>
    setMinor((prev) => ({ ...prev, [key]: value }));

  const toggleConsent = (purpose: ResponsavelPurpose) =>
    setMinor((prev) => ({ ...prev, purposes: togglePurpose(prev.purposes, purpose) }));

  const finish = () => goToResponsavelPanel((path) => void router.push(path), onSuccess);

  /** Etapa 2 → 3: cria a conta do responsável com auto-login (cookies emitidos). */
  async function submitMinorAccount(input: ResponsavelSignupInput): Promise<boolean> {
    const invalid = validateMinor(minor);
    if (invalid) {
      setError(invalid);
      return false;
    }
    setError(null);
    setSubmitting(true);
    const result = await postGuardianSignup({
      name: input.name,
      identifier: input.identifier,
      password: input.password,
      role: 'RESPONSAVEL',
      origem: input.origem,
      guardianProfile: buildGuardianProfile(accessMode, minor),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    setPlayerId(result.data.playerId ?? null);
    setStep(3);
    return true;
  }

  /** Etapa 3: indica equipe técnica (vínculo PENDING ou convite WhatsApp) ou pula. */
  async function submitStaffIndication(): Promise<boolean> {
    if (!staffIndication || !playerId) {
      finish();
      return true;
    }
    setError(null);
    setSubmitting(true);
    const result = await postStaffIndication(playerId, staffIndication);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    // Externo: guarda o link assinado para o compartilhamento no WhatsApp.
    if (result.data.kind === 'EXTERNAL_COACH' && result.data.inviteUrl) {
      setInviteUrl(result.data.inviteUrl);
      return true;
    }
    finish();
    return true;
  }

  return {
    step, setStep,
    accessMode, setAccessMode,
    minor, setMinorField, toggleConsent,
    staffIndication, setStaffIndication, inviteUrl,
    submitting, error, setError,
    submitMinorAccount, submitStaffIndication, finish,
  };
}
