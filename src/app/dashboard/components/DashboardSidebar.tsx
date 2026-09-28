import { logger } from "@/lib/logger";

interface MenuItem {
  emoji: string;
  label: string;
  action: () => void;
}

interface DashboardSidebarProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  menuItems: MenuItem[];
}

export function DashboardSidebar({ menuOpen, setMenuOpen, menuItems }: DashboardSidebarProps) {
  if (!menuOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <nav
        className="relative z-[70] bg-telemetry-card w-72 max-w-full h-full shadow-xl flex flex-col p-4 select-none border-r border-white/10"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-telemetry-text-muted uppercase">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
            className="p-2 rounded-lg text-telemetry-text-muted hover:bg-telemetry-elevated transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <ul className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  logger.info("[DashboardPage] menu item click", item.label);
                  setMenuOpen(false);
                  item.action();
                }}
                className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-telemetry-text-primary hover:bg-telemetry-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-volt"
              >
                <span className="text-lg" aria-hidden="true">
                  {item.emoji}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
