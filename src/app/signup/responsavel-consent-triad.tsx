'use client';

import type { ResponsavelPurpose } from './responsavel-onboarding-logic';
import { CONSENT_TRIAD_ITEMS } from './responsavel-consent-items';

interface ResponsavelConsentTriadProps {
  purposes: ResponsavelPurpose[];
  declaration: boolean;
  onToggle: (purpose: ResponsavelPurpose) => void;
  onToggleDeclaration: (val: boolean) => void;
}

export function ResponsavelConsentTriad({
  purposes,
  declaration,
  onToggle,
  onToggleDeclaration,
}: ResponsavelConsentTriadProps) {
  return (
    <div className="space-y-2.5">
      <div className="border border-telemetry-border/30 rounded-xl p-3 bg-telemetry-elevated/30 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-xs font-semibold text-telemetry-text-primary">
            Autorizações de Uso (Termo v2.0):
          </span>
          <a
            href="/termos/responsavel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-telemetry-blue hover:underline font-medium"
          >
            Ler termo completo (v2.0) ↗
          </a>
        </div>

        {CONSENT_TRIAD_ITEMS.map((item) => {
          const checked = purposes.includes(item.purpose);
          return (
            <div key={item.purpose} className="flex items-start gap-2 text-xs">
              <input
                id={`responsavel-purpose-${item.purpose}`}
                type="checkbox"
                checked={checked}
                disabled={item.purpose === 'DATA'}
                onChange={() => onToggle(item.purpose)}
                className="mt-0.5 w-4 h-4 accent-telemetry-blue cursor-pointer shrink-0"
              />
              <label
                htmlFor={`responsavel-purpose-${item.purpose}`}
                className="text-telemetry-text-muted leading-relaxed cursor-pointer"
              >
                <strong className="text-telemetry-text-primary font-semibold">{item.badge}:</strong>{' '}
                <span>{item.desc}</span>{' '}
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-telemetry-blue hover:underline text-[11px]"
                  title="Ver detalhes"
                >
                  ↗
                </a>
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 text-xs border border-telemetry-border/20 p-2.5 rounded-lg bg-telemetry-base/50">
        <input
          id="responsavel-declaration"
          type="checkbox"
          checked={declaration}
          onChange={(e) => onToggleDeclaration(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-telemetry-blue cursor-pointer shrink-0"
        />
        <label htmlFor="responsavel-declaration" className="text-telemetry-text-muted leading-relaxed cursor-pointer">
          Declaro que sou o responsável legal do atleta menor e que li o{' '}
          <a
            href="/termos/responsavel#declaracao-tutela"
            target="_blank"
            rel="noopener noreferrer"
            className="text-telemetry-blue font-semibold hover:underline"
          >
            termo completo (versão 2.0) ↗
          </a>
        </label>
      </div>

      <div className="bg-telemetry-alert/10 border border-telemetry-alert/30 rounded-lg p-2 text-[11px] text-telemetry-alert">
        ℹ️ Apenas 1 responsável legal é registrado para cada atleta menor (Monotutela Estrita).
      </div>
    </div>
  );
}
