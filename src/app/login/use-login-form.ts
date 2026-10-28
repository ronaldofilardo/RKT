'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { writeToSessionOnly, loginRequest } from '@/lib/auth-client';
import { decodeJwtPayload } from '@/lib/jwt-client';
import { homeForProfileString } from '@/core/access/home';

export function useLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitLoginForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      identifier: (formData.get('identifier') as string || '').trim(),
      password: (formData.get('password') as string || '').trim(),
    };

    const parsed = LoginPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      setError('Dados inválidos. Informe seu e-mail ou CPF e a senha.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await loginRequest(parsed.data);
      const effectiveProfile = (data.user as any).profile ?? data.user.role;

      // Decodificar JWT para obter pp (platformPreset) como fonte da verdade para
      // roteamento por perfil de plataforma (SUPORTE, ADMIN, etc.).
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
        router.push(homeForProfileString(finalProfile) as any);
      }
    } catch (err) {
      // Resposta do servidor rejeitada mostra a mensagem retornada;
      // falha de rede mostra mensagem generica.
      if (err instanceof Error && err.message !== 'Erro ao fazer login') {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Erro de conexao com o servidor');
      } else {
        setError('Erro ao fazer login');
      }
      setIsLoading(false);
    }
  }

  return { error, isLoading, submitLoginForm };
}
