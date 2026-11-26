'use client';

import { useEmitirSenha } from './use-emitir-senha';
import { EmitirSenhaSearchStep } from './emitir-senha-step-search';
import { EmitirSenhaConfirmStep, EmitirSenhaDoneStep } from './emitir-senha-step-result';

interface EmitirSenhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const s = useEmitirSenha(open, onOpenChange);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="emitir-senha-title">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="emitir-senha-title" className="text-base font-semibold text-telemetry-text-primary">
            Emitir Senha Provisória
          </h2>
          <button onClick={s.handleClose} className="text-telemetry-text-muted hover:text-telemetry-text-primary text-xl leading-none" aria-label="Fechar">×</button>
        </div>

        {s.step === 'search' && (
          <EmitirSenhaSearchStep
            query={s.query}
            setQuery={s.setQuery}
            results={s.results}
            loading={s.loading}
            inputRef={s.inputRef}
            onSearch={s.handleSearch}
            onSelect={s.handleSelect}
          />
        )}

        {s.step === 'confirm' && s.selected && (
          <EmitirSenhaConfirmStep
            selected={s.selected}
            loading={s.loading}
            onBack={s.backToSearch}
            onIssue={s.handleIssue}
          />
        )}

        {s.step === 'done' && (
          <EmitirSenhaDoneStep
            token={s.token}
            expiresAt={s.expiresAt}
            onClose={s.handleClose}
            onCopy={s.handleCopy}
          />
        )}
      </div>
    </div>
  );
}
