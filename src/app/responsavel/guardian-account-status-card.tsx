'use client';

import { useState } from 'react';
import { ProvisionAccountModal } from './provision-account-modal';

interface AccountStatusCardProps {
  playerId?: string;
  account?: {
    hasAccount: boolean;
    email?: string | null;
    mustChangePassword?: boolean;
    createdAt?: string | null;
  };
  onReload: () => void;
}

export function GuardianAccountStatusCard({ playerId, account, onReload }: AccountStatusCardProps) {
  const [showModal, setShowModal] = useState(false);
  const hasAccount = account?.hasAccount;

  return (
    <>
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h2 className="text-sm font-bold text-telemetry-text-primary">Status da Conta do Menor</h2>
            <p className="text-xs text-telemetry-text-muted mt-0.5">
              Supervisão e transparência de acesso sob o ECA Digital (Lei 15.211/2025).
            </p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
            hasAccount ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-telemetry-elevated text-telemetry-text-muted border-telemetry-border/30'
          }`}>
            {hasAccount ? 'Conta Habilitada' : 'Acesso Não Habilitado'}
          </span>
        </div>

        {hasAccount ? (
          <div className="text-xs text-telemetry-text-muted space-y-1 pt-2 border-t border-telemetry-border/20">
            <p>E-mail de login: <span className="text-telemetry-text-primary font-medium">{account.email}</span></p>
            <p>Primeiro acesso: <span className="text-telemetry-text-primary font-medium">{account.mustChangePassword ? 'Pendente de troca de senha inicial' : 'Concluído'}</span></p>
            {account.createdAt && (
              <p>Habilitada em: <span className="text-telemetry-text-primary font-medium">{new Date(account.createdAt).toLocaleDateString('pt-BR')}</span></p>
            )}
          </div>
        ) : (
          <div className="pt-2 border-t border-telemetry-border/20 space-y-2.5">
            <p className="text-xs text-telemetry-text-muted">
              O dependente ainda não possui login individual para acessar o app.
            </p>
            {playerId && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-3.5 py-2 text-xs bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold rounded-lg shadow-sm"
              >
                🔑 Habilitar Login do Menor no Aplicativo
              </button>
            )}
          </div>
        )}
      </div>

      {playerId && (
        <ProvisionAccountModal
          open={showModal}
          playerId={playerId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); onReload(); }}
        />
      )}
    </>
  );
}
