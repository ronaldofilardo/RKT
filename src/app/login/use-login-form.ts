'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { writeToSessionOnly, loginRequest } from '@/lib/auth-client';

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
      writeToSessionOnly({
        userId: data.user.id,
        userRole: data.user.role,
        userName: data.user.name,
      });

      const isSecure = window.location.protocol === 'https:';
      document.cookie = `user_role=${data.user.role}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`;

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
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
