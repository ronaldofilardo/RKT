'use client';

/**
 * FinanceiroSection — Aba de gestão financeira do Painel do Suporte.
 *
 * Placeholder estrutural: o modelo de negócio (planos, ciclos, valores) ainda
 * não está definido. As seções internas são scaffolded para receber as APIs e
 * componentes assim que o modelo for definido.
 *
 * Seções previstas:
 *   1. Visão geral — totais por status de assinatura e vencimentos próximos
 *   2. Assinaturas — tabela de CTs com plano, status e ações
 *   3. Cobranças — invoices pendentes, confirmação de pagamento, anulação
 *   4. Planos — catálogo (somente leitura para SUPORTE; edição apenas ADMIN)
 */
export function FinanceiroSection() {
  return (
    <div className="p-0 sm:p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Financeiro</h2>
        <p className="text-xs text-telemetry-text-muted">
          Gestão de assinaturas, cobranças e planos da plataforma.
        </p>
      </div>

      {/* Visão geral */}
      <section aria-labelledby="fin-overview-heading" className="space-y-3">
        <h3 id="fin-overview-heading" className="text-sm font-semibold text-telemetry-text-primary uppercase tracking-wide">
          Visão Geral
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['Em trial', 'Ativos', 'Em atraso', 'Suspensos'] as const).map((label) => (
            <div
              key={label}
              className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-4 flex flex-col gap-1"
            >
              <span className="text-xs text-telemetry-text-muted">{label}</span>
              <span className="text-2xl font-bold text-telemetry-text-primary">—</span>
            </div>
          ))}
        </div>
      </section>

      {/* Assinaturas */}
      <section aria-labelledby="fin-subs-heading" className="space-y-3">
        <h3 id="fin-subs-heading" className="text-sm font-semibold text-telemetry-text-primary uppercase tracking-wide">
          Assinaturas
        </h3>
        <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
          <p className="text-sm text-telemetry-text-muted text-center">
            Disponível após definição do modelo de negócio e criação das APIs de assinatura.
          </p>
        </div>
      </section>

      {/* Cobranças */}
      <section aria-labelledby="fin-invoices-heading" className="space-y-3">
        <h3 id="fin-invoices-heading" className="text-sm font-semibold text-telemetry-text-primary uppercase tracking-wide">
          Cobranças
        </h3>
        <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
          <p className="text-sm text-telemetry-text-muted text-center">
            Invoices e confirmações de pagamento — disponível após criação das APIs de cobrança.
          </p>
        </div>
      </section>

      {/* Planos */}
      <section aria-labelledby="fin-plans-heading" className="space-y-3">
        <h3 id="fin-plans-heading" className="text-sm font-semibold text-telemetry-text-primary uppercase tracking-wide">
          Planos
        </h3>
        <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
          <p className="text-sm text-telemetry-text-muted text-center">
            Catálogo de planos — disponível após definição do modelo de negócio.
          </p>
        </div>
      </section>
    </div>
  );
}
