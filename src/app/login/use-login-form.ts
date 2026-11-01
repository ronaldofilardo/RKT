'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { loginRequest, type SessionContextOption } from '@/lib/auth-client';
import { processLoginSuccess } from './login-success.logic';

export type LoginErrorField = 'identifier' | 'password' | 'both' | null;

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<LoginErrorField>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingContexts, setPendingContexts] = useState<SessionContextOption[] | null>(null);
  const [savedCredentials, setSavedCredentials] = useState<{ identifier: string; password: string } | null>(null);

  const clearForm = useCallback(() => {
    if (formRef.current) formRef.current.reset();
    setPendingContexts(null);
    setSavedCredentials(null);
  }, []);

  useEffect(() => {
    clearForm();
    const handlePageShow = (e: PageTransitionEvent) => { if (e.persisted) clearForm(); };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [clearForm]);

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
      await processLoginSuccess(data, searchParams, (url) => router.push(url as any));
    } catch (err: any) {
      if (formRef.current) {
        const passEl = formRef.current.elements.namedItem('password') as HTMLInputElement | null;
        if (passEl) passEl.value = '';
      }
      setError(err?.message || 'Erro ao fazer login');
      setErrorField(err?.code === 'USER_NOT_FOUND' ? 'identifier' : err?.code === 'INVALID_PASSWORD' ? 'password' : 'both');
      setIsLoading(false);
    }
  }

  async function submitLoginForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = {
      identifier: (formData.get('identifier') as string || '').trim(),
      password: (formData.get('password') as string || '').trim(),
    };

    const parsed = LoginPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message || 'Informe e-mail ou CPF e a senha.');
      setErrorField(String(firstIssue?.path?.[0] || '') === 'password' ? 'password' : 'identifier');
      return;
    }
    await handleLoginAttempt(parsed.data as { identifier: string; password: string });
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
    submitLoginForm,
    selectContext,
    cancelContextSelection,
  };
}
