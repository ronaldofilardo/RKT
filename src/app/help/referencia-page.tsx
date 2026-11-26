import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findHelpReferencia } from '@content/help';

interface HelpReferenciaPageProps {
  slug: string;
}

/**
 * Renderiza uma página de referência transversal (glosário, FAQ).
 * Rotas estáticas (`/help/glosario`, `/help/faq`) têm precedência
 * sobre o segmento dinâmico `/help/[perfil]`.
 */
export function HelpReferenciaPage({ slug }: HelpReferenciaPageProps) {
  const pagina = findHelpReferencia(slug);
  if (!pagina) notFound();

  const Content = pagina.Component;
  return (
    <article>
      <nav aria-label="Trilha de navegação" className="mb-6 text-sm">
        <Link
          href="/help"
          className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline"
        >
          {'← Central de Ajuda'}
        </Link>
      </nav>
      <Content />
    </article>
  );
}
