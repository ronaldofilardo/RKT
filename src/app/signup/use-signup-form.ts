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

  function setFieldError(field: SignupField, message: string | null) {
    setFieldErrors((prev) => ({ ...prev, [field]: message ?? undefined }));
  }

  function handleBlur(field: SignupField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldError(field, validateSignupField(field, values[field]));
  }

  function handleNameChange(value: string) {
    setName(value);
    if (touched.name) setFieldError('name', validateSignupField('name', value));
  }

  function handleIdentifierChange(value: string) {
    const next = formatIdentifierInput(value);
    setIdentifier(next);
    if (touched.identifier) setFieldError('identifier', validateSignupField('identifier', next));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (touched.password) setFieldError('password', validateSignupField('password', value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError('Aceite os Termos de Uso e a Política de Privacidade para continuar');
      return;
    }
    if (role === 'GESTOR') {
      setShowGestorModal(true);
      return;
    }

    const nextErrors: Partial<Record<SignupField, string>> = {};
    const nameError = validateSignupField('name', name);
    const identifierError = validateSignupField('identifier', identifier);
    const passwordError = validateSignupField('password', password);
    if (nameError) nextErrors.name = nameError;
    if (identifierError) nextErrors.identifier = identifierError;
    if (passwordError) nextErrors.password = passwordError;

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
      if (!res.ok) setError(data.message || data.error || 'Erro ao criar conta');
      else router.push('/login');
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
