import { appPath } from '@/core/access/app-path.logic';
import { prefixForArea } from '@/core/access/areas';

export type DashboardEmptyProfile = 'ATHLETE' | 'COACH' | 'MANAGER' | 'SPECTATOR';

export interface DashboardEmptyCta {
  label: string;
  href: string;
}

export interface DashboardEmptyStateContent {
  icon: string;
  title: string;
  description: string;
  primaryCta: DashboardEmptyCta;
  secondaryCta?: DashboardEmptyCta;
  tip: string;
}

export const DASHBOARD_EMPTY_STATES: Record<DashboardEmptyProfile, DashboardEmptyStateContent> = {
  ATHLETE: {
    icon: '🎾',
    title: 'Bem-vindo à sua central de telemetria',
    description: 'Você ainda não possui partidas registradas no seu histórico.',
    primaryCta: { label: '+ Criar Minha Primeira Partida', href: '/match/new' },
    tip: 'Ao registrar seus jogos, o RKT calcula automaticamente seu índice de pressão, saque e momentum.',
  },
  COACH: {
    icon: '🧑‍🏫',
    title: 'Pronto para iniciar os treinos e anotações?',
    description: 'Nenhuma partida em andamento ou registrada para os seus atletas.',
    primaryCta: { label: '+ Nova Partida', href: '/match/new' },
    secondaryCta: { label: 'Cadastrar Atleta', href: '/atletas' },
    tip: 'Vincule seus atletas para acompanhar a evolução técnica e relatórios comparativos.',
  },
  MANAGER: {
    icon: '🏛️',
    title: 'Seu Centro de Treinamento está pronto',
    description: 'Seu clube já está ativo. Comece estruturando sua comissão técnica e seus jogadores.',
    primaryCta: { label: '+ Cadastrar Treinadores', href: '/gestor?tab=coaches' },
    secondaryCta: { label: '+ Cadastrar Atletas', href: '/gestor?tab=athletes' },
    tip: 'Gere links com senha provisória de 7 dias para que sua equipe acesse o sistema rapidamente.',
  },
  SPECTATOR: {
    icon: '👀',
    title: 'Acompanhe seus jogos favoritos',
    description: 'Você ainda não criou nem acompanha nenhuma partida ativa.',
    primaryCta: { label: '+ Anotar uma Partida', href: '/match/new' },
    tip: 'Você também pode solicitar o link de transmissão de uma partida ao vivo para assistir aos pontos em tempo real.',
  },
};

const AREA_TO_PROFILE: Record<string, DashboardEmptyProfile> = {
  ATLETA: 'ATHLETE',
  TREINADOR_CLUBE: 'COACH',
  TREINADOR_AVULSO: 'COACH',
  GESTOR: 'MANAGER',
  ESPECTADOR: 'SPECTATOR',
};

export function resolveDashboardEmptyProfile(activeArea?: string | null): DashboardEmptyProfile | null {
  if (!activeArea) return null;
  return AREA_TO_PROFILE[activeArea] ?? null;
}

export function getDashboardEmptyState(activeArea?: string | null): DashboardEmptyStateContent | null {
  const profile = resolveDashboardEmptyProfile(activeArea);
  return profile ? DASHBOARD_EMPTY_STATES[profile] : null;
}

/** Converte o href do CTA para a rota da área ativa (ex.: /atleta/match/new). */
export function resolveDashboardEmptyHref(href: string, activeArea?: string | null): string {
  if (activeArea === 'GESTOR' && href.startsWith('/gestor')) {
    return `${prefixForArea('GESTOR')}${href.slice('/gestor'.length)}`;
  }
  return appPath(activeArea, href);
}
