import { logger } from "@/lib/logger";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardTopBarProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  user: { name: string; role: string } | null;
  onNewMatch: () => void;
  onLogout: () => void;
}

export function DashboardTopBar({ menuOpen, setMenuOpen, user, onNewMatch, onLogout }: DashboardTopBarProps) {
  return (
    <header className="bg-telemetry-card border-b border-telemetry-border/10 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
            className="p-2 rounded-lg text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-6 h-6 text-telemetry-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-telemetry-text-primary tracking-wide">Início</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onNewMatch}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-telemetry-blue hover:bg-telemetry-blue-light text-white shadow-sm transition-colors"
                aria-label="Nova partida"
              >
                + Nova Partida
              </button>
              <span className="hidden md:inline text-sm text-telemetry-text-muted font-medium">{user.name}</span>
              {user.role === "ADMIN" && (
                <span className="text-xs px-2 py-0.5 rounded bg-telemetry-alert text-telemetry-base font-bold">
                  Admin
                </span>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="text-sm text-telemetry-error hover:opacity-80 font-semibold transition-opacity"
                aria-label="Sair"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
