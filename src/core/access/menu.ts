import {
  ADMIN, DADOS_PESSOAIS, ESPECTADOR, FINANCEIRO, GESTAO, OPERACAO, SAIR, SUPORTE, TORNEIOS, TREINADOR,
  atletaItems,
} from './menu-items';
import type { MenuContext, MenuItem, MenuSection, MenuSectionKey } from './menu-types';

function section(key: MenuSectionKey, title: string, items: readonly MenuItem[]): MenuSection {
  return { key, title, items: items.map((item) => ({ ...item })) };
}

function canSeeOperation(ctx: MenuContext): boolean {
  return ctx.canOperate && !ctx.coach && !(ctx.gestor?.ctStatus === 'ACTIVE') && !ctx.isAdmin && !ctx.isSuporte;
}

/** Áreas administrativas/gestão não exibem "Dados Pessoais" no menu. */
const AREAS_WITHOUT_PERSONAL_DATA = new Set<string>([
  'ADMIN', 'SUPORTE', 'GESTOR', 'TREINADOR_CLUBE',
]);

function canSeePersonalData(ctx: MenuContext, area?: string | null): boolean {
  if (area) return !AREAS_WITHOUT_PERSONAL_DATA.has(area);
  if (ctx.isAdmin || ctx.isSuporte || ctx.gestor) return false;
  return !(ctx.coach && ctx.coach.ctIds.length > 0);
}

function footerItems(ctx: MenuContext, area?: string | null): MenuItem[] {
  const items: MenuItem[] = [];
  if (canSeePersonalData(ctx, area)) items.push(DADOS_PESSOAIS);
  items.push(SAIR);
  return items;
}

function dedupeKeepLast(sections: MenuSection[]): MenuSection[] {
  const seen = new Set<string>();
  const result: MenuSection[] = [];
  for (const current of [...sections].reverse()) {
    const items = current.items.filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
    if (items.length > 0) result.unshift({ ...current, items });
  }
  return result;
}

function coachItems(isClub: boolean): MenuItem[] {
  return [...TREINADOR.map((i) => (i.key === 'treinador-atletas' && isClub ? { ...i, label: 'Atletas' } : { ...i })), FINANCEIRO];
}

function buildMenuForArea(ctx: MenuContext, area: string): MenuSection[] {
  const sections: MenuSection[] = [];
  if (area === 'ATLETA' && ctx.athlete) {
    sections.push(section('atleta', 'Atleta', atletaItems(ctx.athlete)));
  } else if ((area === 'TREINADOR_AVULSO' || area === 'TREINADOR_CLUBE') && ctx.coach) {
    sections.push(section('treinador', 'Treinador', coachItems(area === 'TREINADOR_CLUBE')));
  } else if (area === 'GESTOR' && ctx.gestor?.ctStatus === 'ACTIVE') {
    sections.push(section('gestao', 'Gestão do Clube', [...GESTAO, TORNEIOS, FINANCEIRO]));
  } else if (area === 'ANOTADOR' && ctx.canOperate) {
    sections.push(section('operacao', 'Operação', OPERACAO));
  } else if (area === 'ADMIN' && ctx.isAdmin) {
    sections.push(section('admin', 'Admin', [ADMIN]));
  } else if (area === 'SUPORTE' && ctx.isSuporte) {
    sections.push(section('suporte', 'Suporte', SUPORTE));
  } else if (area === 'ESPECTADOR') {
    sections.push(section('operacao', 'Partidas', ESPECTADOR));
  }
  sections.push(section('rodape', 'Conta', footerItems(ctx, area)));
  return dedupeKeepLast(sections);
}

export function buildMenu(ctx: MenuContext): MenuSection[] {
  if (!ctx.isActive || ctx.mustChangePassword) return [];
  if (ctx.activeArea) return buildMenuForArea(ctx, ctx.activeArea);

  const sections: MenuSection[] = [];
  if (canSeeOperation(ctx)) sections.push(section('operacao', 'Operação', OPERACAO));
  if (ctx.athlete) sections.push(section('atleta', 'Atleta', atletaItems(ctx.athlete)));
  if (ctx.coach) {
    const isClub = Boolean(ctx.coach.ctIds && ctx.coach.ctIds.length > 0);
    sections.push(section('treinador', 'Treinador', coachItems(isClub)));
  }
  if (ctx.gestor?.ctStatus === 'ACTIVE') sections.push(section('gestao', 'Gestão do Clube', [...GESTAO, TORNEIOS, FINANCEIRO]));
  if (ctx.isAdmin) sections.push(section('admin', 'Admin', [ADMIN]));
  sections.push(section('rodape', 'Conta', footerItems(ctx)));

  return dedupeKeepLast(sections);
}
