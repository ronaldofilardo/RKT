'use client';

import Link from 'next/link';
import { HelpSearch } from '@/components/help/help-search';

const GESTOR_TOPICS = [
  {
    slug: 'por-onde-comecar',
    title: 'Por onde começar',
    description: 'Painel do clube: visão geral, treinadores, atletas, partidas e dados do clube.',
  },
  {
    slug: 'gestao-de-membros',
    title: 'Gestão de membros',
    description: 'Cadastrar e editar treinadores e atletas, links de convite e regeneração de acesso.',
  },
  {
    slug: 'partidas-e-solicitacoes',
    title: 'Partidas e solicitações',
    description: 'Partidas do clube, atribuição de anotadores, solicitações pendentes e dados do clube.',
  },
];

export function GestorHelpTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-telemetry-border/30 bg-telemetry-surface/40 p-5">
        <h2 className="text-lg font-semibold text-telemetry-text mb-2">Central de Ajuda do Gestor</h2>
        <p className="text-sm text-telemetry-text-muted mb-4">
          Consulte os guias operacionais do clube, tire dúvidas sobre partidas, membros e privacidade.
        </p>
        <HelpSearch />
      </div>

      <div>
        <h3 className="text-base font-semibold text-telemetry-text mb-3">Tópicos para Gestores</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GESTOR_TOPICS.map((art) => (
            <Link
              key={art.slug}
              href={`/help/gestor/${art.slug}`}
              className="flex flex-col justify-between rounded-lg border border-telemetry-border/20 bg-telemetry-surface/20 p-4 hover:border-telemetry-blue/50 transition-colors"
            >
              <div>
                <span className="font-semibold text-telemetry-text block mb-1">{art.title}</span>
                <span className="text-xs text-telemetry-text-muted leading-relaxed line-clamp-3">
                  {art.description}
                </span>
              </div>
              <span className="text-xs font-medium text-telemetry-blue hover:underline mt-3 block">
                Ler artigo →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-telemetry-border/10">
        <h3 className="text-base font-semibold text-telemetry-text mb-3">Referências Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/help/glosario"
            className="rounded-lg border border-telemetry-border/20 px-4 py-2.5 text-sm font-medium hover:border-telemetry-blue/40 text-telemetry-text-muted hover:text-white transition-colors"
          >
            📖 Glosário do RKT
          </Link>
          <Link
            href="/help/faq"
            className="rounded-lg border border-telemetry-border/20 px-4 py-2.5 text-sm font-medium hover:border-telemetry-blue/40 text-telemetry-text-muted hover:text-white transition-colors"
          >
            ❓ Perguntas Frequentes (FAQ)
          </Link>
          <Link
            href="/help"
            className="rounded-lg border border-telemetry-border/20 px-4 py-2.5 text-sm font-medium hover:border-telemetry-blue/40 text-telemetry-text-muted hover:text-white transition-colors"
          >
            🏢 Ver Central Completa
          </Link>
        </div>
      </div>
    </div>
  );
}
