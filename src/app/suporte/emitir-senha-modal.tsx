'use client';

import { useState } from 'react';
import type { UserSearchResult } from './types';
import { searchUserByCpfOrEmail, issuePasswordReset } from './suporte-mutations';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

interface EmitirSenhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'search' | 'confirm' | 'done';

/**
 * F4 — Emissão de senha provisória por CPF ou e-mail.
 *
 * Fluxo:
 *   1. Suporte informa CPF ou e-mail do usuário
 *   2. Sistema busca e exibe nome + e-mail mascarado para confirmação
 *   3. Suporte confirma → link gerado → exibido para cópia
 *
 * Reutiliza POST /api/support/password-resets (já existente).
 */
export function EmitirSenhaModal({ open, onOpenChange }: EmitirSenhaModalProps) {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="emitir-senha-title">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="emitir-senha-title" className="text-base font-semibold text-telemetry-text-primary">
            Emitir Senha Provisória
          </h2>
          <button onClick={handleClose} className="text-telemetry-text-muted hover:text-telemetry-text-primary text-xl leading-none" aria-label="Fechar">×</button>
        </div>

        {/* Step 1 — Busca */}
        {step === 'search' && (
          <div className="space-y-4">
            <p className="text-xs text-telemetry-text-muted">
              Informe o CPF (somente números) ou o e-mail do usuário para localizar a conta.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="CPF ou e-mail"
                className="flex-1 bg-telemetry-base border border-telemetry-border/30 rounded-lg px-3 py-2 text-sm text-telemetry-text-primary placeholder:text-telemetry-text-muted focus:outline-none focus:border-telemetry-blue"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-telemetry-blue text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-telemetry-blue/80 transition-colors"
              >
                {loading ? '...' : 'Buscar'}
              </button>
            </div>

            {results.length > 0 && (
              <ul className="divide-y divide-telemetry-border/20 border border-telemetry-border/20 rounded-xl overflow-hidden">
                {results.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => handleSelect(u)}
                      className="w-full text-left px-4 py-3 hover:bg-telemetry-elevated/40 transition-colors"
                    >
                      <p className="text-sm font-medium text-telemetry-text-primary">{u.name}</p>
                      <p className="text-xs text-telemetry-text-muted">{u.email} · {u.role}</p>
                      {!u.isActive && (
                        <span className="text-[10px] text-telemetry-error font-semibold uppercase tracking-wide">Conta inativa</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Step 2 — Confirmação */}
        {step === 'confirm' && selected && (
          <div className="space-y-4">
            <div className="bg-telemetry-elevated/40 border border-telemetry-border/20 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-telemetry-text-primary">{selected.name}</p>
              <p className="text-xs text-telemetry-text-muted">{selected.email}</p>
              <p className="text-xs text-telemetry-text-muted">Perfil: {selected.role}</p>
            </div>
            <p className="text-xs text-telemetry-text-muted">
              Será gerado um link de redefinição válido por <strong>7 dias</strong>. O usuário deverá trocar a senha no primeiro acesso.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setStep('search')} className="px-4 py-2 text-sm text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
                Voltar
              </button>
              <button
                onClick={handleIssue}
                disabled={loading}
                className="px-4 py-2 bg-telemetry-blue text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-telemetry-blue/80 transition-colors"
              >
                {loading ? 'Gerando...' : 'Confirmar e gerar link'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Link gerado */}
        {step === 'done' && (
          <div className="space-y-4">
            <div className="bg-telemetry-volt/10 border border-telemetry-volt/30 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-telemetry-volt uppercase tracking-wide">Link gerado com sucesso</p>
              <p className="text-xs text-telemetry-text-muted break-all font-mono">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/redefinir-senha?token=${token}`}
              </p>
              {expiresAt && (
                <p className="text-xs text-telemetry-text-muted">
                  Válido até: {new Date(expiresAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <p className="text-xs text-telemetry-text-muted">
              Envie este link para o usuário. Ele só pode ser usado uma vez e expira em 7 dias.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
                Fechar
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-telemetry-blue text-white text-sm font-medium rounded-lg hover:bg-telemetry-blue/80 transition-colors"
              >
                Copiar link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
