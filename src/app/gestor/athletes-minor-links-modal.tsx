'use client';

import { AthletesMinorConsentPending } from './athletes-minor-consent-pending';
import { AthletesMinorLinksActive } from './athletes-minor-links-active';

interface AthletesMinorLinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minorName: string;
  token: string;
  guardianNoticeToken: string;
  guardianName?: string;
  expiresAt?: string;
  isConsented?: boolean;
  mode?: 'LINK' | 'ECA';
}

export function AthletesMinorLinksModal({
  open, onOpenChange, minorName, token, guardianNoticeToken,
  guardianName, expiresAt, isConsented = false, mode = 'LINK',
}: AthletesMinorLinksModalProps) {
  if (!open) return null;
  const showActiveLinks = isConsented && mode !== 'ECA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-telemetry-card border border-telemetry-border/20 text-telemetry-text-primary rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-telemetry-blue uppercase tracking-wide">Atleta Menor de Idade</span>
              {isConsented ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">Consentimento Confirmado</span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded-full">Autorização Pendente</span>
              )}
            </div>
            <h2 className="text-lg font-bold">
              {showActiveLinks ? 'Links de Acesso e Comunicação' : 'Consentimento do Responsável (ECA)'}
            </h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-telemetry-text-muted hover:text-telemetry-text-primary">✕</button>
        </div>

        {showActiveLinks ? (
          <AthletesMinorLinksActive
            minorName={minorName}
            token={token}
            guardianNoticeToken={guardianNoticeToken}
            guardianName={guardianName}
            expiresAt={expiresAt}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <AthletesMinorConsentPending
            guardianName={guardianName}
            guardianNoticeToken={guardianNoticeToken}
            expiresAt={expiresAt}
            onClose={() => onOpenChange(false)}
          />
        )}
      </div>
    </div>
  );
}
