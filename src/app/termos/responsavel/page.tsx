import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';
import { TermosIntroSections } from './sections-intro';
import { TermosAuthorizationsSections } from './sections-authorizations';
import { TermosLegalSections } from './sections-legal';

export const metadata: Metadata = {
  title: 'Termo de Consentimento do Responsável Legal (v2.0) | RKT',
  description: 'Descritivo completo das autorizações de tutela, proteção de dados esportivos, transmissão com nome anonimizado e pool estatístico (ECA Digital e LGPD).',
};

export default function TermosResponsavelPage() {
  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center border-b border-telemetry-border/20 pb-4 mb-6">
          <BrandLogo size="md" priority />
          <span className="text-xs uppercase font-semibold text-telemetry-blue bg-telemetry-blue/10 px-2.5 py-1 rounded">
            Versão 2.0 • Nov/2026
          </span>
        </header>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Termo de Consentimento do Responsável Legal</h1>
          <p className="text-xs text-telemetry-text-muted mt-1">
            Governança, Tutela e Privacidade de Atletas Menores de Idade · LGPD (Art. 14) e ECA Digital (Lei 15.211/2025).
          </p>
        </div>

        <article className="space-y-4">
          <TermosIntroSections />
          <TermosAuthorizationsSections />
          <TermosLegalSections />
        </article>

        <footer className="mt-8 pt-6 border-t border-telemetry-border/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Link href="/termos" className="text-xs text-telemetry-blue hover:underline">
            ← Ver Termos Gerais de Uso
          </Link>
          <span className="text-[11px] text-telemetry-text-muted">
            RKT Platform · Controladoria Conjunta com Centro de Treinamento
          </span>
        </footer>
      </div>
    </main>
  );
}
