import type { HelpPerfilContent } from '../types';
import porOndeComecar from './por-onde-comecar.mdx';
import membros from './gestao-de-membros.mdx';
import partidas from './partidas-e-solicitacoes.mdx';

/** Conteúdo do perfil Gestor (espelha o array `GESTAO` e as abas de `/gestor`). */
export const gestorContent: HelpPerfilContent = {
  slug: 'gestor',
  title: 'Gestor',
  articles: [
    {
      slug: 'por-onde-comecar',
      title: 'Por onde começar',
      description: 'Painel do clube: visão geral, treinadores, atletas, partidas e dados do clube.',
      Component: porOndeComecar,
    },
    {
      slug: 'gestao-de-membros',
      title: 'Gestão de membros',
      description: 'Cadastrar e editar treinadores e atletas, links de convite e regeneração de acesso.',
      Component: membros,
    },
    {
      slug: 'partidas-e-solicitacoes',
      title: 'Partidas e solicitações',
      description: 'Partidas do clube, atribuição de anotadores, solicitações pendentes e dados do clube.',
      Component: partidas,
    },
  ],
};
