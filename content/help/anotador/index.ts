import type { HelpPerfilContent } from '../types';
import porOndeComecar from './por-onde-comecar.mdx';
import anotacao from './anotacao-e-correcoes.mdx';

/** Conteúdo do perfil Anotador (espelha o array `OPERACAO`). */
export const anotadorContent: HelpPerfilContent = {
  slug: 'anotador',
  title: 'Anotador',
  articles: [
    {
      slug: 'por-onde-comecar',
      title: 'Por onde começar',
      description: 'Menu de operação: partidas aguardando, ao vivo, histórico e anotações.',
      Component: porOndeComecar,
    },
    {
      slug: 'anotacao-e-correcoes',
      title: 'Anotação e correções',
      description: 'Registrar pontos, ler a timeline, desfazer erros e corrigir o placar.',
      Component: anotacao,
    },
  ],
};
