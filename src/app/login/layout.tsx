import type { Metadata } from 'next';

/** Metadados canônicos da rota pública de autenticação (Fase 5 — PLANO_SEO_ESTRUTURAL). */
export const metadata: Metadata = {
  title: 'Acesse sua Conta | RKT',
  description:
    'Acesse a plataforma RKT Tennis com e-mail ou CPF para registrar, anotar e analisar partidas de tênis.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
