import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HELP_PERFIL_CONTENT, findHelpPerfil } from '@content/help';

interface HelpArticlePageProps {
  params: Promise<{ perfil: string; slug: string }>;
}

export function generateStaticParams() {
  return HELP_PERFIL_CONTENT.flatMap((perfil) =>
    perfil.articles.map((article) => ({ perfil: perfil.slug, slug: article.slug })),
  );
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  const { perfil: perfilSlug, slug } = await params;
  const perfil = findHelpPerfil(perfilSlug);
  const article = perfil?.articles.find((item) => item.slug === slug);
  if (!perfil || !article) notFound();

  const Content = article.Component;
  return (
    <article>
      <nav aria-label="Trilha de navegação" className="mb-6 text-sm">
        <Link
          href={`/help/${perfil.slug}`}
          className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline"
        >
          {`← ${perfil.title}`}
        </Link>
      </nav>
      <Content />
    </article>
  );
}
