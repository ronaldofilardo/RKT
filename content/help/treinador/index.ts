import type { HelpPerfilContent } from '../types';
import porOndeComecar from './por-onde-comecar.mdx';
import meusAtletas from './meus-atletas-e-vinculos.mdx';
import aoVivo from './acompanhar-ao-vivo.mdx';

/** Conteúdo do perfil Treinador (clube e avulso — espelha o array `TREINADOR`). */
export const treinadorContent: HelpPerfilContent = {
  slug: 'treinador',
  title: 'Treinador',
  articles: [
    {
      slug: 'por-onde-comecar',
      title: 'Por onde começar',
      description: 'Menu do treinador: histórico, partidas anotadas, atletas e relatórios.',
      Component: porOndeComecar,
    },
    {
      slug: 'meus-atletas-e-vinculos',
      title: 'Meus atletas e vínculos',
      description: 'Gerenciar a lista de atletas, vínculos de treinamento e solicitações.',
      Component: meusAtletas,
    },
    {
      slug: 'acompanhar-ao-vivo',
      title: 'Acompanhar ao vivo',
      description: 'Telas Ao Vivo, Partidas Anotadas e como ler a timeline ponto a ponto.',
      Component: aoVivo,
    },
  ],
};
