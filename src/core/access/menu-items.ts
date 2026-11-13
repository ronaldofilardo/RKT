import type { AthleteContext, MenuItem } from './menu-types';
import { link, soon } from './menu-factory.logic';

export const OPERACAO: readonly MenuItem[] = [
  link('inicio', 'Início', '/dashboard', '🏠'),
  link('historico', 'Histórico', '/historico', '📜'),
  link('partidas-anotadas', 'Partidas Anotadas', '/partidasanotadas', '📝'),
  link('ao-vivo', 'Ao Vivo', '/partidasaovivo', '🔴'),
  link('aguardando', 'Aguardando', '/aguardandoanotador', '⏳'),
  link('partidas-publicas', 'Partidas Públicas', '/partidas-publicas', '📡'),
  link('atletas', 'Atletas', '/atletas', '📋'),
  link('nova-partida', 'Nova Partida', '/match/new', '➕'),
];

export const FINANCEIRO = soon('financeiro', 'Financeiro', '💰');
export const TORNEIOS = soon('torneios', 'Torneios', '🏆');

export const TREINADOR: readonly MenuItem[] = [
  link('treinador-inicio', 'Início', '/dashboard', '🏠'),
  link('treinador-historico', 'Histórico', '/historico', '📜'),
  link('treinador-partidas-anotadas', 'Partidas Anotadas', '/partidasanotadas', '📝'),
  link('treinador-ao-vivo', 'Ao Vivo', '/partidasaovivo', '🔴'),
  link('treinador-atletas', 'Meus Atletas', '/atletas', '🎾'),
  soon('treinador-solicitacoes', 'Solicitações', '📨'),
  link('treinador-relatorios', 'Relatórios', '/relatorios', '📊'),
  link('partidas-publicas', 'Partidas Públicas', '/partidas-publicas', '📡'),
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
  link('suporte-clubes', 'Clubes', '/suporte?tab=clubes', '🏢'),
  link('suporte-gestores', 'Gestores', '/suporte?tab=gestores', '🧑‍💼'),
  link('suporte-avulsos', 'Treinadores e Atletas', '/suporte?tab=avulsos', '🎾'),
  link('suporte-externos', 'Atletas Externos', '/suporte?tab=externos', '🌍'),
];

export const ESPECTADOR: readonly MenuItem[] = [
  link('espectador-publicas', 'Partidas Públicas', '/partidas-publicas', '📡'),
  link('espectador-aovivo', 'Ao Vivo', '/partidasaovivo', '🔴'),
];

export const ADMIN: MenuItem = link('admin', 'Admin', '/admin', '⚙️');
export const DADOS_PESSOAIS: MenuItem = link('dados-pessoais', 'Dados Pessoais', '/dados-pessoais', '👤');
export const SAIR: MenuItem = { key: 'sair', label: 'Sair', icon: '🚪', action: 'logout' };

export function atletaItems(athlete: AthleteContext): MenuItem[] {
  const items: MenuItem[] = [
    link('atleta-inicio', 'Início', '/dashboard', '🏠'),
    link('atleta-partidas', 'Minhas Partidas', '/historico', '📜'),
    link('atleta-nova-partida', 'Nova Partida', '/match/new', '➕'),
    link('atleta-publicas', 'Partidas Públicas', '/partidas-publicas', '📡'),
    link('atleta-relatorios', 'Relatórios', '/relatorios', '📊'),
    link('atleta-estatisticas', 'Minhas Estatísticas', '/atleta/estatisticas', '📈', true, 'Em breve'),
    link('atleta-treinador', 'Meu Treinador', '/atleta/treinador', '🧑‍🏫', true, 'Em breve'),
    link('atleta-clubes', athlete.ctIds.length > 0 ? 'Meus Clubes' : 'Vincular a clube', '/atleta/clubes', '🏟️', true, 'Em breve'),
  ];
  if (athlete.isMinor) {
    items.push(link('atleta-responsaveis', 'Responsáveis', '/atleta/responsaveis', '👪', true, 'Em breve'));
  }
  return items;
}
