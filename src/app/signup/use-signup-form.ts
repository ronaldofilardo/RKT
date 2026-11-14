'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatIdentifierInput, validateSignupField, type SignupField } from './signup-validation.logic';

export type SignupRole = 'ATLETA' | 'TREINADOR' | 'GESTOR' | 'ESPECTADOR';

export function useSignupForm(initialRole: SignupRole) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origem = searchParams.get('origem') ?? undefined;
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignupField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<SignupField, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [showGestorModal, setShowGestorModal] = useState(false);

  const values: Record<SignupField, string> = { name, identifier, password };
  const setFieldError = (field: SignupField, msg: string | null) => setFieldErrors((p) => ({ ...p, [field]: msg ?? undefined }));

  const handleBlur = (f: SignupField) => {
    setTouched((p) => ({ ...p, [f]: true }));
    setFieldError(f, validateSignupField(f, values[f]));
  };

  const handleNameChange = (val: string) => { setName(val); if (touched.name) setFieldError('name', validateSignupField('name', val)); };
  const handleIdentifierChange = (val: string) => { const n = formatIdentifierInput(val); setIdentifier(n); if (touched.identifier) setFieldError('identifier', validateSignupField('identifier', n)); };
  const handlePasswordChange = (val: string) => { setPassword(val); if (touched.password) setFieldError('password', validateSignupField('password', val)); };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!termsAccepted) return setError('Aceite os Termos de Uso e a Política de Privacidade para continuar');
    if (role === 'GESTOR') return setShowGestorModal(true);

    const nextErrors: Partial<Record<SignupField, string>> = {};
    const nErr = validateSignupField('name', name);
    const iErr = validateSignupField('identifier', identifier);
    const pErr = validateSignupField('password', password);
    if (nErr) nextErrors.name = nErr;
    if (iErr) nextErrors.identifier = iErr;
    if (pErr) nextErrors.password = pErr;

    setTouched({ name: true, identifier: true, password: true });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier, password, role, origem }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao criar conta');
      } else {
        router.push('/login');
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') window.location.href = '/login';
      }
    } catch {
      setError('Sem conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return {
    name, identifier, password, role, termsAccepted, error, fieldErrors, touched, loading, showGestorModal,
    setRole, setTermsAccepted, setShowGestorModal,
    handleNameChange, handleIdentifierChange, handlePasswordChange, handleBlur, handleSubmit,
  };
}

export type SignupFormController = ReturnType<typeof useSignupForm>;
