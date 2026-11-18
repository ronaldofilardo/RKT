import type { ResponsavelPurpose } from './responsavel-onboarding-logic';

export interface ConsentTriadItem {
  purpose: ResponsavelPurpose;
  badge: string;
  desc: string;
  href: string;
}

export const CONSENT_TRIAD_ITEMS: ConsentTriadItem[] = [
  {
    purpose: 'DATA',
    badge: 'DATA (Obrigatória — Dados e Equipe do CT)',
    desc: 'Partidas e perfil visíveis ao gestor e treinador anotador.',
    href: '/termos/responsavel#autorizacao-1-dados',
  },
  {
    purpose: 'BROADCAST',
    badge: 'BROADCAST (Opcional — Transmissão e Compartilhamento)',
    desc: 'Acompanhamento pelo responsável com nome anonimizado para terceiros.',
    href: '/termos/responsavel#autorizacao-2-transmissao',
  },
  {
    purpose: 'STATS',
    badge: 'STATS (Opcional — Pool de Estatísticas)',
    desc: 'Desempenho em médias agregadas sem identificação civil (N ≥ 10).',
    href: '/termos/responsavel#autorizacao-3-pool',
  },
];
