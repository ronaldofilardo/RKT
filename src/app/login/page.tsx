"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoginPayloadSchema } from "@/schemas/contracts";
import { writeToSessionOnly } from "@/lib/auth-client";
import { LoginPageView } from "./LoginPage.view";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const parsed = LoginPayloadSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setError('Dados inválidos. Verifique o formulário.');
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erro ao fazer login');
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      writeToSessionOnly({ accessToken: data.accessToken, userId: data.user.id, userRole: data.user.role });
      writeAuthCookies(data.accessToken, data.user.role);
      router.push('/dashboard');
    } catch {
      setError('Erro de conexão');
      setIsLoading(false);
    }
  }

  return <LoginPageView error={error} isLoading={isLoading} onSubmit={handleSubmit} />;
}

function writeAuthCookies(accessToken: string, userRole: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const attributes = `path=/; max-age=${2 * 60 * 60}; SameSite=Lax${secure}`;
  document.cookie = `access_token=${accessToken}; ${attributes}`;
  document.cookie = `user_role=${userRole}; ${attributes}`;
}
