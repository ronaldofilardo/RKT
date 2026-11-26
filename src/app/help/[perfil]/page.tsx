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
    </div>
  );
}
