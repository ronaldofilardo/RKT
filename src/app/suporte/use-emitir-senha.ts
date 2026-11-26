'use client';

import { useState, useRef, useEffect } from 'react';
import type { UserSearchResult } from './types';
import { searchUserByCpfOrEmail, issuePasswordReset } from './suporte-mutations';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

export type EmitirSenhaStep = 'search' | 'confirm' | 'done';

/**
 * Estado e handlers do modal de emissão de senha provisória (F4):
 * busca por CPF/e-mail → confirmação → link gerado para cópia.
 */
export function useEmitirSenha(open: boolean, onOpenChange: (open: boolean) => void) {
  const [step, setStep] = useState<EmitirSenhaStep>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && step === 'search') {
      inputRef.current?.focus();
    }
  }, [open, step]);

  const resetState = () => {
    setStep('search');
    setQuery('');
    setResults([]);
    setSelected(null);
    setToken('');
    setExpiresAt('');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const backToSearch = () => setStep('search');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const items = await searchUserByCpfOrEmail(query);
      setResults(items);
      if (items.length === 0) {
        toast({ type: 'error', message: 'Nenhum usuário encontrado com esse CPF ou e-mail.' });
      }
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao buscar usuário') });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user: UserSearchResult) => {
    setSelected(user);
    setStep('confirm');
  };

  const handleIssue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { token: t, expiresAt: exp } = await issuePasswordReset(selected.id);
      setToken(t);
      setExpiresAt(exp);
      setStep('done');
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao emitir senha provisória') });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/redefinir-senha?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ type: 'success', message: 'Link copiado para a área de transferência.' });
  };

  return {
    step, query, setQuery, results, selected, token, expiresAt, loading, inputRef,
    handleSearch, handleSelect, handleIssue, handleCopy, handleClose, backToSearch,
  };
}
