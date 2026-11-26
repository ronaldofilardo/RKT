import type { ComponentType, PropsWithChildren } from 'react';

/** Componente MDX que renderiza o corpo de um artigo da Central de Ajuda. */
export type HelpMdxComponent = ComponentType<PropsWithChildren>;

/** Artigo de ajuda dentro do conteúdo de um perfil. */
export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  Component: HelpMdxComponent;
}

/** Manifesto de conteúdo de um perfil (Atleta, Treinador, Gestor...). */
export interface HelpPerfilContent {
  slug: string;
  title: string;
  articles: HelpArticle[];
}

/** Página de referência transversal (glosário, FAQ) válida para todos os perfis. */
export interface HelpReferencia {
  slug: string;
  title: string;
  description: string;
  Component: HelpMdxComponent;
}
