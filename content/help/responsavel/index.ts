import type { HelpPerfilContent } from '../types';
import porOndeComecar from './por-onde-comecar.mdx';
import autorizacoes from './autorizacoes-e-consentimentos.mdx';
import acessos from './acessos-e-contas.mdx';
import partidas from './partidas-e-avisos.mdx';

/** Conteúdo do perfil Responsável legal (espelha as abas de `/responsavel`). */
export const responsavelContent: HelpPerfilContent = {
  slug: 'responsavel',
  title: 'Responsável',
  articles: [
    {
      slug: 'por-onde-comecar',
      title: 'Por onde começar',
      description: 'Painel do responsável: autorizações, partidas, avisos e acessos dos dependentes.',
      Component: porOndeComecar,
    },
    {
      slug: 'autorizacoes-e-consentimentos',
      title: 'Autorizações e consentimentos',
      description: 'Como funciona a autorização de tratamento de dados, transmissão e estatísticas.',
      Component: autorizacoes,
    },
    {
      slug: 'acessos-e-contas',
      title: 'Acessos e contas',
      description: 'Convite do dependente, provisionamento de conta e histórico de acessos.',
      Component: acessos,
    },
    {
      slug: 'partidas-e-avisos',
      title: 'Partidas e avisos',
      description: 'Acompanhar as partidas dos dependentes e responder a avisos da plataforma.',
      Component: partidas,
    },
  ],
};
