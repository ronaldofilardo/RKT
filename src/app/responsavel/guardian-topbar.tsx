'use client';

import { useRouter } from 'next/navigation';
import { performLogout } from '@/lib/auth-client';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function GuardianTopBar() {
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
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-telemetry-blue/15 text-telemetry-blue border border-telemetry-blue/30">
              Acompanhante
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
