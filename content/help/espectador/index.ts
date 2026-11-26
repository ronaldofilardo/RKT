import type { HelpPerfilContent } from '../types';
import porOndeComecar from './por-onde-comecar.mdx';
import convite from './convite-e-acompanhamento.mdx';

/** Conteúdo do perfil Espectador (espelha o array `ESPECTADOR`). */
export const espectadorContent: HelpPerfilContent = {
  slug: 'espectador',
  title: 'Espectador',
  articles: [
    {
      slug: 'por-onde-comecar',
      title: 'Por onde começar',
      description: 'Partidas públicas, tela Ao Vivo e o que cada espectador pode ver.',
      Component: porOndeComecar,
    },
    {
      slug: 'convite-e-acompanhamento',
      title: 'Convite e acompanhamento',
      description: 'Link de convite, transmissão ao vivo, correções de placar e partidas fechadas.',
      Component: convite,
    },
  ],
};
