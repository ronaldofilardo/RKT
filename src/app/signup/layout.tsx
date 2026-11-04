import type { Metadata } from 'next';

/** Metadados canônicos da rota pública de cadastro (Fase 5 — PLANO_SEO_ESTRUTURAL). */
export const metadata: Metadata = {
  title: 'Criar Conta | RKT',
  description:
    'Crie sua conta RKT Tennis como atleta, treinador, gestor ou espectador e comece a registrar partidas.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
