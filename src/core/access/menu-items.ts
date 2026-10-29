import type { AthleteContext, MenuItem } from './menu-types';

const link = (key: string, label: string, href: string, icon: string, disabled = false, badge?: string): MenuItem => ({
  key,
  label,
  href,
  icon,
  disabled,
  badge,
});

/** Item ainda não desenvolvido: desabilitado, sem rota. */
const soon = (key: string, label: string, icon: string): MenuItem => ({
  key,
  label,
  icon,
  disabled: true,
  badge: 'Em breve',
});

/** Mesma ordem e rotas do menu do anotador. */
export const OPERACAO: readonly MenuItem[] = [
  link('inicio', 'Início', '/dashboard', '🏠'),
  link('historico', 'Histórico', '/historico', '📜'),
  link('partidas-anotadas', 'Partidas Anotadas', '/partidasanotadas', '📝'),
  link('ao-vivo', 'Ao Vivo', '/partidasaovivo', '🔴'),
  link('aguardando', 'Aguardando', '/aguardandoanotador', '⏳'),
  link('atletas', 'Atletas', '/atletas', '📋'),
  link('nova-partida', 'Nova Partida', '/match/new', '➕'),
];

export const FINANCEIRO = soon('financeiro', 'Financeiro', '💰');
export const TORNEIOS = soon('torneios', 'Torneios', '🏆');

export const TREINADOR: readonly MenuItem[] = [
  soon('treinador-atletas', 'Meus Atletas', '🎾'),
  soon('treinador-solicitacoes', 'Solicitações', '📨'),
  soon('treinador-relatorios', 'Relatórios', '📊'),
  link('nova-partida', 'Nova Partida', '/match/new', '➕'),
];

export const GESTAO: readonly MenuItem[] = [
  link('gestao-visao-geral', 'Visão Geral', '/gestor', '🏛️'),
  link('gestao-treinadores', 'Treinadores', '/gestor?tab=coaches', '🧑‍🏫'),
  link('gestao-atletas', 'Atletas do Clube', '/gestor?tab=athletes', '🎾'),
  link('gestao-partidas', 'Partidas do Clube', '/gestor?tab=matches', '📝'),
  link('gestao-clube', 'Dados do Clube', '/gestor?tab=club', '🏢'),
];

export const SUPORTE: readonly MenuItem[] = [
  link('suporte-clubes', 'Clubes / CTs', '/suporte', '🏢'),
  link('suporte-gestores', 'Gestores', '/suporte?module=gestores', '🤝'),
  link('suporte-avulsos', 'Contas Avulsas', '/suporte?module=avulsos', '👥'),
];

export const ADMIN: MenuItem = link('admin', 'Admin', '/admin', '⚙️');

export const DADOS_PESSOAIS: MenuItem = link(
  'dados-pessoais',
  'Dados Pessoais',
  '/dados-pessoais',
  '👤',
);

export const SAIR: MenuItem = { key: 'sair', label: 'Sair', icon: '🚪', action: 'logout' };

/** Atleta com clube vê "Meus Clubes"; avulso vê "Vincular a clube" (mesma rota). */
export function atletaItems(athlete: AthleteContext): MenuItem[] {
  const items: MenuItem[] = [
    link('atleta-estatisticas', 'Minhas Estatísticas', '/atleta/estatisticas', '📈', true, 'Em breve'),
    link('atleta-treinador', 'Meu Treinador', '/atleta/treinador', '🧑‍🏫', true, 'Em breve'),
    link(
      'atleta-clubes',
      athlete.ctIds.length > 0 ? 'Meus Clubes' : 'Vincular a clube',
      '/atleta/clubes',
      '🏟️',
      true,
      'Em breve',
    ),
  ];
  if (athlete.isMinor) {
    items.push(link('atleta-responsaveis', 'Responsáveis', '/atleta/responsaveis', '👪', true, 'Em breve'));
  }
  return items;
}
