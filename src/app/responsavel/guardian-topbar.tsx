'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { performLogout } from '@/lib/auth-client';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ThemeToggle } from '@/components/ThemeToggle';

interface GuardianTopBarProps {
  canOperate?: boolean;
}

export function GuardianTopBar({ canOperate = false }: GuardianTopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await performLogout();
    } catch {
      // Ignora erro eventual de rede no logout
    }
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      window.location.replace('/login?exit=1');
    } else {
      router.replace('/login');
    }
  };

  return (
    <header className="bg-telemetry-card border-b border-telemetry-border/10 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <BrandLogo size="sm" href="/responsavel" priority />
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-telemetry-text-primary tracking-wide">
              Acompanhamento do Menor
            </h1>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                canOperate
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-telemetry-blue/15 text-telemetry-blue border border-telemetry-blue/30'
              }`}
            >
              {canOperate ? 'Espectador & Acompanhante' : 'Acompanhante'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {canOperate && (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded bg-telemetry-elevated text-telemetry-text-primary hover:bg-telemetry-border/30 border border-telemetry-border/40 transition-colors"
            >
              🎾 Minhas Partidas
            </Link>
          )}
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair da conta"
            className="text-xs sm:text-sm text-telemetry-error hover:opacity-80 font-semibold transition-opacity cursor-pointer px-2 py-1 rounded"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
