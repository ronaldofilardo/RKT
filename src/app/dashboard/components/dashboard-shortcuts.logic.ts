export interface Shortcut {
  key: string;
  icon: string;
  label: string;
  sublabel: string;
  href?: string;
  view?: string;
  highlight?: boolean;
  soon?: boolean;
}

export function getShortcuts(activeArea?: string | null): Shortcut[] {
  switch (activeArea) {
    case 'ATLETA':
      return [
        { key: 'nova', icon: '🎾', label: 'Nova Partida', sublabel: 'Registre um jogo agora', href: '/match/new', highlight: true },
        { key: 'minhas', icon: '📋', label: 'Minhas Partidas', sublabel: 'Histórico completo', view: 'history' },
        { key: 'relatorios', icon: '📊', label: 'Relatórios', sublabel: 'Timelines finalizadas', view: 'reports' },
        { key: 'treinador', icon: '🧑‍🏫', label: 'Meu Treinador', sublabel: 'Vínculo ativo', href: '/atleta/treinador', soon: true },
      ];
    case 'TREINADOR_CLUBE':
      return [
        { key: 'nova', icon: '🎾', label: 'Nova Partida', sublabel: 'Iniciar anotação', href: '/match/new', highlight: true },
        { key: 'minhas', icon: '📋', label: 'Minhas Partidas', sublabel: 'Todas as partidas', view: 'history' },
        { key: 'atletas', icon: '👥', label: 'Atletas', sublabel: 'Atletas do clube', href: '/atletas' },
        { key: 'relatorios', icon: '📊', label: 'Relatórios', sublabel: 'Timelines finalizadas', view: 'reports' },
      ];
    case 'TREINADOR_AVULSO':
      return [
        { key: 'nova', icon: '🎾', label: 'Nova Partida', sublabel: 'Iniciar anotação', href: '/match/new', highlight: true },
        { key: 'minhas', icon: '📋', label: 'Minhas Partidas', sublabel: 'Todas as partidas', view: 'history' },
        { key: 'atletas', icon: '👥', label: 'Meus Atletas', sublabel: 'Gerenciar atletas', href: '/atletas' },
        { key: 'relatorios', icon: '📊', label: 'Relatórios', sublabel: 'Timelines finalizadas', view: 'reports' },
      ];
    case 'ANOTADOR':
      return [
        { key: 'nova', icon: '➕', label: 'Nova Partida', sublabel: 'Iniciar anotação', href: '/match/new', highlight: true },
        { key: 'minhas', icon: '📋', label: 'Minhas Partidas', sublabel: 'Todas as partidas', view: 'history' },
        { key: 'relatorios', icon: '📊', label: 'Relatórios', sublabel: 'Timelines finalizadas', view: 'reports' },
        { key: 'atletas', icon: '📋', label: 'Atletas', sublabel: 'Cadastros', href: '/atletas' },
      ];
    default:
      return [
        { key: 'nova', icon: '🎾', label: 'Anotar Partida', sublabel: 'Registre um jogo', href: '/match/new', highlight: true },
        { key: 'minhas', icon: '📋', label: 'Minhas Partidas', sublabel: 'Todas as partidas', view: 'history' },
        { key: 'relatorios', icon: '📊', label: 'Relatórios', sublabel: 'Timelines finalizadas', view: 'reports' },
      ];
  }
}

export function getGreeting(userName?: string | null, activeArea?: string | null): { title: string; subtitle: string } {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const first = userName ? `, ${userName.split(' ')[0]}` : '';

  const subtitles: Record<string, string> = {
    ATLETA: 'Veja suas partidas, estatísticas e evolução técnica.',
    TREINADOR_CLUBE: 'Gerencie seus atletas e acompanhe o desempenho.',
    TREINADOR_AVULSO: 'Gerencie seus atletas e acompanhe o desempenho.',
    ANOTADOR: 'Anote partidas, acompanhe placares e gere relatórios.',
  };

  return {
    title: `${period}${first} 👋`,
    subtitle: subtitles[activeArea ?? ''] ?? 'Bem-vindo ao RKT — sua central de telemetria de tênis.',
  };
}
