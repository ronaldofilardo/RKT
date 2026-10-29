import type { MenuSection, MenuContext } from "@/core/access/menu-types";
import type { SidebarSection, SidebarItem } from "./DashboardSidebar";
import type { DashboardView } from "../dashboard.types";

interface NavigationHandlers {
  navigateToTarget?: (view: DashboardView) => void;
  routerPush: (href: string) => void;
  endSession: () => void;
}

export function getDefaultMenuContext(role?: string): MenuContext {
  const isAdm = role === 'ADMIN';
  const isSup = role === 'SUPORTE';
  const isGes = role === 'GESTOR';
  const isCoach = role === 'TREINADOR';
  const isAth = role === 'ATLETA';

  return {
    isActive: true,
    mustChangePassword: false,
    canOperate: true,
    isAdmin: isAdm,
    isSuporte: isSup,
    gestor: isGes ? { ctIds: ['ct-default'], ctStatus: 'ACTIVE' } : null,
    coach: isCoach ? { ctIds: [] } : null,
    athlete: isAth ? { playerId: 'p-default', ctIds: [], isMinor: false } : null,
  };
}

export function mapMenuSectionsToSidebar(
  sections: MenuSection[],
  handlers: NavigationHandlers,
): SidebarSection[] {
  const { navigateToTarget, routerPush, endSession } = handlers;
  const isDashboardRoute = typeof window !== 'undefined' && window.location.pathname === '/dashboard';

  return sections.map((sec) => ({
    key: sec.key,
    title: sec.title,
    items: sec.items.map((item): SidebarItem => {
      let action = () => { };
      if (item.action === 'logout') {
        action = endSession;
      } else if (item.href) {
        if (navigateToTarget && isDashboardRoute) {
          if (item.href === '/dashboard') action = () => navigateToTarget('dashboard');
          else if (item.href === '/historico') action = () => navigateToTarget('history');
          else if (item.href === '/partidasanotadas') action = () => navigateToTarget('annotated');
          else if (item.href === '/partidasaovivo') action = () => navigateToTarget('live');
          else if (item.href === '/atletas') action = () => navigateToTarget('atletas');
          else if (item.href === '/match/new') action = () => navigateToTarget('newMatch');
          else if (item.href === '/dados-pessoais') action = () => navigateToTarget('profile');
          else action = () => routerPush(item.href!);
        } else {
          action = () => routerPush(item.href!);
        }
      }

      return {
        key: item.key,
        label: item.label,
        emoji: item.icon || '•',
        disabled: item.disabled,
        badge: item.badge,
        action,
      };
    }),
  }));
}
