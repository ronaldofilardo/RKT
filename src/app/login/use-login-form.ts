'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { writeToSessionOnly, loginRequest } from '@/lib/auth-client';
import { decodeJwtPayload } from '@/lib/jwt-client';
import { homeForProfileString } from '@/core/access/home';

export type LoginErrorField = 'identifier' | 'password' | 'both' | null;

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<LoginErrorField>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitLoginForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setErrorField(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      identifier: (formData.get('identifier') as string || '').trim(),
      password: (formData.get('password') as string || '').trim(),
    };

    const parsed = LoginPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMsg = firstIssue?.message || 'Dados inválidos. Informe seu e-mail ou CPF e a senha.';
      setError(errorMsg);
      const fieldPath = String(firstIssue?.path?.[0] || '');
      setErrorField(fieldPath === 'password' ? 'password' : 'identifier');
      setIsLoading(false);
      return;
    }

    try {
      const data = await loginRequest(parsed.data);
      const effectiveProfile = (data.user as any).profile ?? data.user.role;

      let jwtPlatformPreset: string | null = null;
      if (data.accessToken) {
        const decoded = await decodeJwtPayload(data.accessToken);
        jwtPlatformPreset = decoded?.pp ?? null;
      }
      const finalProfile = jwtPlatformPreset ?? effectiveProfile;

      writeToSessionOnly({
        userId: data.user.id,
        userRole: finalProfile,
        userName: data.user.name,
      });

      const isSecure = window.location.protocol === 'https:';
      document.cookie = `user_role=${finalProfile}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`;

      if ((data.user as any)?.mustChangePassword) {
        router.push('/trocar-senha');
      } else {
        const rawNext = searchParams.get('next');
        const isSafeNext = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//');
        const target = isSafeNext ? rawNext : homeForProfileString(finalProfile);
        router.push(target as any);
      }
    } catch (err) {
      const code = (err as any)?.code;
      if (err instanceof Error) {
        setError(err.message);
        if (code === 'USER_NOT_FOUND') {
          setErrorField('identifier');
        } else if (code === 'INVALID_PASSWORD') {
          setErrorField('password');
        } else {
          setErrorField('both');
        }
      } else if (err instanceof TypeError) {
        setError('Erro de conexão com o servidor');
        setErrorField(null);
      } else {
        setError('Erro ao fazer login');
        setErrorField('both');
      }
      setIsLoading(false);
    }
  }

  return { error, errorField, isLoading, submitLoginForm };
}
