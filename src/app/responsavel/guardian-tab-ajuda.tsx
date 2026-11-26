'use client';

import Link from 'next/link';
import { HelpSearch } from '@/components/help/help-search';
import { GuardianPrivacyHighlight } from './guardian-privacy-highlight';

const RESPONSAVEL_TOPICS = [
  {
    slug: 'por-onde-comecar',
    title: 'Por onde começar',
    description: 'Painel do responsável: autorizações, partidas, avisos e acessos dos dependentes.',
  },
  {
    slug: 'autorizacoes-e-consentimentos',
    title: 'Autorizações e consentimentos',
    description: 'Como funciona a autorização de tratamento de dados, transmissão e estatísticas.',
  },
  {
    slug: 'acessos-e-contas',
    title: 'Acessos e contas',
    description: 'Convite do dependente, provisionamento de conta e histórico de acessos.',
  },
  {
    slug: 'partidas-e-avisos',
    title: 'Partidas e avisos',
    description: 'Acompanhar as partidas dos dependentes e responder a avisos da plataforma.',
  },
];

export function GuardianTabAjuda() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-telemetry-border/30 bg-telemetry-surface/40 p-5">
        <h2 className="text-lg font-semibold text-telemetry-text-primary mb-1">Central de Ajuda do Responsável</h2>
        <p className="text-xs text-telemetry-text-muted mb-4">
          Pesquise dúvidas sobre autorizações, privacidade de menores, partidas compartilhadas e uso da plataforma.
        </p>
        <HelpSearch />
      </div>

      <GuardianPrivacyHighlight />

      <div>
        <h3 className="text-base font-semibold text-telemetry-text-primary mb-3">Guias do Responsável</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {RESPONSAVEL_TOPICS.map((art) => (
            <Link
              key={art.slug}
              href={`/help/responsavel/${art.slug}`}
              className="flex flex-col justify-between rounded-lg border border-telemetry-border/20 bg-telemetry-surface/20 p-4 hover:border-telemetry-blue/50 transition-colors"
            >
              <div>
                <span className="font-semibold text-sm text-telemetry-text-primary block mb-1">{art.title}</span>
                <span className="text-xs text-telemetry-text-muted leading-relaxed">{art.description}</span>
              </div>
              <span className="text-xs font-medium text-telemetry-blue hover:underline mt-3 block">Ler artigo →</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-telemetry-border/10">
        <h3 className="text-base font-semibold text-telemetry-text-primary mb-3">Documentos e Referências</h3>
        <div className="flex flex-wrap gap-2.5 text-xs sm:text-sm">
          <Link href="/termos/responsavel" className="rounded-lg border border-telemetry-border/20 px-3.5 py-2 font-medium hover:border-telemetry-blue/40 text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
            📜 Termo do Responsável
          </Link>
          <Link href="/privacidade" className="rounded-lg border border-telemetry-border/20 px-3.5 py-2 font-medium hover:border-telemetry-blue/40 text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
            🔒 Política de Privacidade
          </Link>
          <Link href="/help/glosario" className="rounded-lg border border-telemetry-border/20 px-3.5 py-2 font-medium hover:border-telemetry-blue/40 text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
            📖 Glosário do RKT
          </Link>
          <Link href="/help/faq" className="rounded-lg border border-telemetry-border/20 px-3.5 py-2 font-medium hover:border-telemetry-blue/40 text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
            ❓ Perguntas Frequentes
          </Link>
        </div>
      </div>
    </div>
  );
}
