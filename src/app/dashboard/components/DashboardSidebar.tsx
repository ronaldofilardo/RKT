import { logger } from "@/lib/logger";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface SidebarItem {
  key?: string;
  emoji: string;
  label: string;
  disabled?: boolean;
  badge?: string;
  action: () => void;
}

export interface SidebarSection {
  key: string;
  title: string;
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  menuItems?: SidebarItem[];
  sections?: SidebarSection[];
}

export function DashboardSidebar({ menuOpen, setMenuOpen, menuItems, sections }: DashboardSidebarProps) {
  if (!menuOpen) return null;

  const contentSections: SidebarSection[] = sections || [
    { key: "default", title: "", items: menuItems || [] },
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled) return;
    logger.info("[DashboardPage] menu item click", item.label);
    setMenuOpen(false);
    item.action();
  };

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <nav className="relative z-[70] bg-telemetry-card w-72 max-w-full h-full shadow-xl flex flex-col p-4 select-none border-r border-telemetry-border/10 overflow-y-auto" aria-label="Menu">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-telemetry-text-muted uppercase">Menu</span>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" className="p-2 rounded-lg text-telemetry-text-muted hover:bg-telemetry-elevated transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-4">
          {contentSections.map((sec) => (
            <div key={sec.key} className="space-y-1">
              {sec.title && <div className="text-[10px] font-bold tracking-wider text-telemetry-text-muted uppercase px-2 py-1">{sec.title}</div>}
              <ul className="space-y-0.5">
                {sec.items.map((item) => (
                  <li key={item.key || item.label}>
                    <button
                      type="button"
                      disabled={item.disabled}
                      aria-disabled={item.disabled}
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm text-telemetry-text-primary ${
                        item.disabled ? "opacity-45 cursor-not-allowed" : "hover:bg-telemetry-elevated focus-visible:ring-2 focus-visible:ring-telemetry-volt"
                      }`}
                    >
                      <span className="text-base" aria-hidden="true">{item.emoji}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-telemetry-elevated text-telemetry-text-muted font-medium">{item.badge}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-auto border-t border-telemetry-border/10">
          <span className="block text-xs font-semibold text-telemetry-text-muted uppercase mb-2">Tema</span>
          <ThemeToggle fullWidth />
        </div>
      </nav>
    </div>
  );
}
