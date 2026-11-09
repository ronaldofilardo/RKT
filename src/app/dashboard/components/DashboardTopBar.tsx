'use client';

import { logger } from "@/lib/logger";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ContextSwitcher } from "@/components/ui/context-switcher";
import type { SessionContextOption } from "@/lib/auth-client-login";

interface DashboardTopBarProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  user: { name: string; role: string } | null;
  title?: string;
  onNewMatch?: () => void;
  onLogout?: () => void;
  showMenuButton?: boolean;
  activeContextId?: string | null;
  availableContexts?: SessionContextOption[];
  onContextSwitched?: () => void;
  showLogout?: boolean;
}

export function DashboardTopBar({
  menuOpen, setMenuOpen, user, title, onLogout, showMenuButton = true,
  activeContextId, availableContexts, onContextSwitched, showLogout = true,
}: DashboardTopBarProps) {
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : '';
  const homeHref = user?.role === 'GESTOR' ? '/gestor' : '/dashboard';

  return (
    <header className="bg-telemetry-card border-b border-telemetry-border/10 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" href={homeHref} priority />
          <h1 className="text-lg font-bold text-telemetry-text-primary tracking-wide">{title ?? 'Início'}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ContextSwitcher activeContextId={activeContextId} availableContexts={availableContexts} onContextSwitched={onContextSwitched} />
          <ThemeToggle />
          {firstName && <span className="hidden md:inline text-sm text-telemetry-text-muted font-medium">{firstName}</span>}
          {user?.role === "ADMIN" && <span className="text-xs px-2 py-0.5 rounded bg-telemetry-alert text-telemetry-base font-bold">Admin</span>}
          {showLogout && onLogout && (
            <button type="button" onClick={onLogout} aria-label="Sair"
              className="text-sm text-telemetry-error hover:opacity-80 font-semibold transition-opacity cursor-pointer">
              Sair
            </button>
          )}

          {showMenuButton && (
            <button
              type="button"
              data-testid="hamburger-menu-button"
              onClick={() => {
                const next = !menuOpen;
                logger.info("[DashboardPage] hamburger click menuOpen=", next);
                setMenuOpen(next);
              }}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              className="p-2 rounded-lg text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6 text-telemetry-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
