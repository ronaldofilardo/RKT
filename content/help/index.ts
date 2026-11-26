import type { HelpPerfilContent, HelpReferencia } from './types';
import { atletaContent } from './atleta';
import { treinadorContent } from './treinador';
import { gestorContent } from './gestor';
import { responsavelContent } from './responsavel';
import { espectadorContent } from './espectador';
import { anotadorContent } from './anotador';
import glosario from './referencia/glosario.mdx';
import faq from './referencia/faq.mdx';

export type { HelpArticle, HelpPerfilContent, HelpMdxComponent, HelpReferencia } from './types';

/** Manifesto agregado dos conteúdos por perfil (ordem de exibição na Central). */
export const HELP_PERFIL_CONTENT: HelpPerfilContent[] = [
  atletaContent,
  treinadorContent,
  gestorContent,
  responsavelContent,
  espectadorContent,
  anotadorContent,
];

/** Páginas de referência transversais (válidas para todos os perfis). */
export const HELP_REFERENCIA: HelpReferencia[] = [
  {
    slug: 'glosario',
    title: 'Glosário',
    description: 'Termos de pontuação, siglas da timeline, transmissão e privacidade.',
    Component: glosario,
  },
  {
    slug: 'faq',
    title: 'Perguntas frequentes',
    description: 'Dúvidas sobre convites, placar, planos, privacidade e estatísticas.',
    Component: faq,
  },
];

export function findHelpPerfil(slug: string): HelpPerfilContent | null {
  return HELP_PERFIL_CONTENT.find((perfil) => perfil.slug === slug) ?? null;
}

export function findHelpReferencia(slug: string): HelpReferencia | null {
  return HELP_REFERENCIA.find((pagina) => pagina.slug === slug) ?? null;
}
