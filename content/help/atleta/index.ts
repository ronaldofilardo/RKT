import type { HelpPerfilContent } from '../types';
import porOndeComecar from './por-onde-comecar.mdx';
import minhasPartidas from './minhas-partidas-e-relatorios.mdx';
import novaPartida from './nova-partida-e-convites.mdx';
import seusDados from './privacidade-e-seus-dados.mdx';

/** Conteúdo do perfil Atleta (espelha os itens de `atletaItems` em `menu-items.ts`). */
export const atletaContent: HelpPerfilContent = {
  slug: 'atleta',
  title: 'Atleta',
  articles: [
    {
      slug: 'por-onde-comecar',
      title: 'Por onde começar',
      description: 'Primeiros passos: dados pessoais, menu do atleta e acompanhamento das partidas.',
      Component: porOndeComecar,
    },
    {
      slug: 'minhas-partidas-e-relatorios',
      title: 'Minhas partidas e relatórios',
      description: 'Histórico de partidas, relatórios pós-jogo e partidas públicas da comunidade.',
      Component: minhasPartidas,
    },
    {
      slug: 'nova-partida-e-convites',
      title: 'Nova partida e convites',
      description: 'Montar um confronto, convidar o adversário e compartilhar o acompanhamento ao vivo.',
      Component: novaPartida,
    },
    {
      slug: 'privacidade-e-seus-dados',
      title: 'Privacidade e seus dados',
      description: 'Dados pessoais, direitos do titular (LGPD) e regras para menores de idade.',
      Component: seusDados,
    },
  ],
};
