'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginRequest, type SessionContextOption } from '@/lib/auth-client';
import { processLoginSuccess } from './login-success.logic';
import { humanizeLoginError } from './login-errors.logic';
import { parseLoginPayload } from './login-payload.logic';
import { usePasswordChangeNotice } from './use-password-change-notice';
import { useLoginFormReset } from './use-login-form-reset';

export type LoginErrorField = 'identifier' | 'password' | 'both' | null;

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<LoginErrorField>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingContexts, setPendingContexts] = useState<SessionContextOption[] | null>(null);
  const [savedCredentials, setSavedCredentials] = useState<{ identifier: string; password: string } | null>(null);
  const { passwordChangeNotice, scheduleRedirect } = usePasswordChangeNotice();
  const resetContexts = useCallback(() => {
    setPendingContexts(null);
    setSavedCredentials(null);
  }, []);
  const formRef = useLoginFormReset(resetContexts);

  async function handleLoginAttempt(payload: { identifier: string; password: string; contextId?: string }) {
    setError(null);
    setErrorField(null);
    setIsLoading(true);

    try {
      const data = await loginRequest(payload);
      if (data.requireContext && data.availableContexts?.length) {
        setPendingContexts(data.availableContexts);
        setSavedCredentials({ identifier: payload.identifier, password: payload.password });
        setIsLoading(false);
        return;
      }
      if (data.user.mustChangePassword) {
        setPendingContexts(null);
        setIsLoading(false);
        scheduleRedirect(() => {
          void processLoginSuccess(data, searchParams, (url) => router.push(url as any));
        });
        return;
      }
      await processLoginSuccess(data, searchParams, (url) => router.push(url as any));
    } catch (err: any) {
      if (formRef.current) {
        const passEl = formRef.current.elements.namedItem('password') as HTMLInputElement | null;
        if (passEl) passEl.value = '';
      }
      setError(humanizeLoginError(err));
      setErrorField(err?.code === 'USER_NOT_FOUND' ? 'identifier' : err?.code === 'INVALID_PASSWORD' ? 'password' : 'both');
      setIsLoading(false);
    }
  }

  async function submitLoginForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = parseLoginPayload(new FormData(e.currentTarget));
    if (!parsed.ok) {
      setError(parsed.message);
      setErrorField(parsed.field);
      return;
    }
    await handleLoginAttempt(parsed.data);
  }

  async function selectContext(contextId: string) {
    if (!savedCredentials) return;
    await handleLoginAttempt({ ...savedCredentials, contextId });
  }

  function cancelContextSelection() {
    setPendingContexts(null);
    setSavedCredentials(null);
  }

  return {
    formRef,
    error,
    errorField,
    isLoading,
    pendingContexts,
    passwordChangeNotice,
    submitLoginForm,
    selectContext,
    cancelContextSelection,
  };
}
