import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HELP_PERFIL_CONTENT, findHelpPerfil } from '@content/help';

interface HelpPerfilPageProps {
  params: Promise<{ perfil: string }>;
}

export function generateStaticParams() {
  return HELP_PERFIL_CONTENT.map((perfil) => ({ perfil: perfil.slug }));
}

export default async function HelpPerfilPage({ params }: HelpPerfilPageProps) {
  const { perfil: perfilSlug } = await params;
  const perfil = findHelpPerfil(perfilSlug);
  if (!perfil) notFound();

  return (
    <div>
      <p className="text-sm text-telemetry-text-muted mb-1">Central de Ajuda</p>
      <h1 className="text-2xl font-bold mb-6">{perfil.title}</h1>
      <ul className="space-y-4">
        {perfil.articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/help/${perfil.slug}/${article.slug}`}
              className="block rounded-lg border border-telemetry-border/20 p-4 hover:border-telemetry-blue/60 focus-visible:border-telemetry-blue"
            >
              <span className="font-semibold">{article.title}</span>
              <span className="block text-sm text-telemetry-text-muted mt-1">
                {article.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="referencia-titulo" className="mt-10 pt-6 border-t border-telemetry-border/10">
        <h2 id="referencia-titulo" className="text-lg font-semibold mb-4">
          Referência
        </h2>
        <ul className="space-y-4">
          <li>
            <Link
              href="/help/glosario"
              className="block rounded-lg border border-telemetry-border/20 p-4 hover:border-telemetry-blue/60 focus-visible:border-telemetry-blue"
            >
              <span className="font-semibold">Glosário</span>
              <span className="block text-sm text-telemetry-text-muted mt-1">
                Termos de pontuação, siglas da timeline, transmissão e privacidade.
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/help/faq"
              className="block rounded-lg border border-telemetry-border/20 p-4 hover:border-telemetry-blue/60 focus-visible:border-telemetry-blue"
            >
              <span className="font-semibold">Perguntas frequentes</span>
              <span className="block text-sm text-telemetry-text-muted mt-1">
                Dúvidas sobre convites, placar, planos, privacidade e estatísticas.
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
