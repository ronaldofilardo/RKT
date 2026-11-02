export type AreaCode =
  | 'ADMIN'
  | 'SUPORTE'
  | 'GESTOR'
  | 'TREINADOR_CLUBE'
  | 'TREINADOR_AVULSO'
  | 'ATLETA'
  | 'ANOTADOR'
  | 'ESPECTADOR';

export interface AreaOption {
  code: AreaCode;
  label: string;
  prefix: string;
  home: string;
  ctId?: string | null;
  ctName?: string | null;
}

export interface UserAreaDiscoveryInput {
  role?: string | null;
  canOperate?: boolean | null;
  isAdmin?: boolean;
  isSuporte?: boolean;
  memberships?: Array<{
    kind: string;
    preset?: string | null;
    ctId?: string | null;
    ctName?: string | null;
    status?: string | null;
  }> | null;
  athlete?: { playerId: string } | null;
  hasParticularCoach?: boolean;
}

export const AREA_PREFIXES: Record<AreaCode, string> = {
  ADMIN: '/admin',
  SUPORTE: '/suporte',
  GESTOR: '/clube/gestor',
  TREINADOR_CLUBE: '/clube/treinador',
  TREINADOR_AVULSO: '/treinador',
  ATLETA: '/atleta',
  ANOTADOR: '/anotador',
  ESPECTADOR: '/espectador',
};

export const prefixForArea = (code: AreaCode): string => AREA_PREFIXES[code] || '/dashboard';
export const homeForArea = (code: AreaCode): string => prefixForArea(code);

function createOption(code: AreaCode, label: string, ctId?: string | null, ctName?: string | null): AreaOption {
  const prefix = prefixForArea(code);
  return { code, label, prefix, home: prefix, ...(ctId ? { ctId, ctName } : {}) };
}

export function listAreas(input: UserAreaDiscoveryInput): AreaOption[] {
  const areas: AreaOption[] = [];
  const memberships = (input.memberships || []).filter((m) => m.status !== 'SUSPENDED');

  if (input.isAdmin || input.role === 'ADMIN' || memberships.some((m) => m.preset === 'ADMIN')) {
    areas.push(createOption('ADMIN', 'Administração Global'));
  }
  if (input.isSuporte || memberships.some((m) => m.preset === 'SUPORTE')) {
    areas.push(createOption('SUPORTE', 'Suporte da Plataforma'));
  }
  for (const m of memberships) {
    if (m.kind === 'GESTOR' && m.ctId) {
      areas.push(createOption('GESTOR', `Gestão: ${m.ctName || 'Clube'}`, m.ctId, m.ctName));
    }
    if (m.kind === 'TREINADOR' && m.ctId) {
      areas.push(createOption('TREINADOR_CLUBE', `Treinador: ${m.ctName || 'Clube'}`, m.ctId, m.ctName));
    }
  }
  if (input.hasParticularCoach || memberships.some((m) => m.kind === 'TREINADOR' && !m.ctId)) {
    areas.push(createOption('TREINADOR_AVULSO', 'Treinador Particular'));
  }
  if (input.athlete) areas.push(createOption('ATLETA', 'Painel do Atleta'));
  if (input.canOperate) areas.push(createOption('ANOTADOR', 'Anotador de Partidas'));
  if (areas.length === 0) areas.push(createOption('ESPECTADOR', 'Espectador'));

  return areas;
}
