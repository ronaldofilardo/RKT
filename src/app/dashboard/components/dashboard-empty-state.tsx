import Link from 'next/link';
import { getDashboardEmptyState, resolveDashboardEmptyHref } from './dashboard-empty-state.logic';

const PRIMARY_CTA_CLASS =
  'w-full sm:w-auto px-4 py-2 rounded-lg bg-telemetry-blue hover:bg-telemetry-blue-light text-white text-sm font-semibold shadow-sm transition-colors text-center';
const SECONDARY_CTA_CLASS =
  'w-full sm:w-auto px-4 py-2 rounded-lg border border-telemetry-border/30 hover:bg-telemetry-elevated text-telemetry-text-primary text-sm font-semibold transition-colors text-center';

interface DashboardEmptyStateProps {
  activeArea?: string | null;
}

/** Estado vazio do dashboard com mensagem, CTAs e dica específicos do perfil ativo. */
export function DashboardEmptyState({ activeArea }: DashboardEmptyStateProps) {
  const content = getDashboardEmptyState(activeArea);

  if (!content) {
    return (
      <p className="text-telemetry-text-muted text-center py-8">Nenhuma partida por aqui ainda.</p>
    );
  }

  const primaryHref = resolveDashboardEmptyHref(content.primaryCta.href, activeArea);
  const secondaryHref = content.secondaryCta
    ? resolveDashboardEmptyHref(content.secondaryCta.href, activeArea)
    : null;

  return (
    <div className="mx-auto max-w-lg text-center px-5 py-10 space-y-4 rounded-2xl border border-telemetry-border/20 bg-telemetry-card">
      <div className="text-4xl" aria-hidden="true">
        {content.icon}
      </div>
      <h3 className="text-lg font-bold text-telemetry-text-primary">{content.title}</h3>
      <p className="text-sm text-telemetry-text-muted">{content.description}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
        <Link href={primaryHref as any} className={PRIMARY_CTA_CLASS}>
          {content.primaryCta.label}
        </Link>
        {content.secondaryCta && secondaryHref && (
          <Link href={secondaryHref as any} className={SECONDARY_CTA_CLASS}>
            {content.secondaryCta.label}
          </Link>
        )}
      </div>
      <p className="text-xs text-telemetry-text-muted flex items-start justify-center gap-1.5 pt-1">
        <span aria-hidden="true">💡</span>
        <span>{content.tip}</span>
      </p>
    </div>
  );
}
