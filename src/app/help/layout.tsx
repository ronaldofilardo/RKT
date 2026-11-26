import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export const metadata: Metadata = {
  title: { default: 'Central de Ajuda | RKT', template: '%s | Central de Ajuda | RKT' },
  description:
    'Central de Ajuda do RKT: guias por perfil, glosário de tênis e perguntas frequentes da plataforma.',
  robots: { index: false, follow: false },
};

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-start mb-8">
          <BrandLogo size="md" priority />
        </div>

        {children}

        <div className="mt-10 pt-6 border-t border-telemetry-border/10">
          <Link
            href="/"
            className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline text-sm font-medium"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
