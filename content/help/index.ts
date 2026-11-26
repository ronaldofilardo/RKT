import type { ComponentType, PropsWithChildren } from 'react';
import atletaPorOndeComecar from './atleta/por-onde-comecar.mdx';

export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  Component: ComponentType<PropsWithChildren>;
}

export interface HelpPerfilContent {
  slug: string;
  title: string;
  articles: HelpArticle[];
}

/** Manifesto versionado dos artigos da Central de Ajuda por perfil. */
export const HELP_PERFIL_CONTENT: HelpPerfilContent[] = [
  {
    slug: 'atleta',
    title: 'Atleta',
    articles: [
      {
        slug: 'por-onde-comecar',
        title: 'Por onde começar',
        description: 'Primeiros passos: dados pessoais, menu do atleta e acompanhamento ao vivo.',
        Component: atletaPorOndeComecar,
      },
    ],
  },
];

export function findHelpPerfil(slug: string): HelpPerfilContent | null {
  return HELP_PERFIL_CONTENT.find((perfil) => perfil.slug === slug) ?? null;
}
