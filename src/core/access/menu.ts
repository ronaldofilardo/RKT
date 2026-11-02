import {
  ADMIN, DADOS_PESSOAIS, FINANCEIRO, GESTAO, OPERACAO, SAIR, TORNEIOS, TREINADOR,
  atletaItems,
} from './menu-items';
import type { MenuContext, MenuItem, MenuSection, MenuSectionKey } from './menu-types';

function section(key: MenuSectionKey, title: string, items: readonly MenuItem[]): MenuSection {
  return { key, title, items: items.map((item) => ({ ...item })) };
}

function canSeeOperation(ctx: MenuContext): boolean {
  return ctx.canOperate && !ctx.coach && !(ctx.gestor?.ctStatus === 'ACTIVE') && !ctx.isAdmin && !ctx.isSuporte;
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

function buildMenuForArea(ctx: MenuContext, area: string): MenuSection[] {
  const sections: MenuSection[] = [];
  if (area === 'ATLETA' && ctx.athlete) {
    sections.push(section('atleta', 'Atleta', atletaItems(ctx.athlete)));
  } else if ((area === 'TREINADOR_AVULSO' || area === 'TREINADOR_CLUBE') && ctx.coach) {
    sections.push(section('treinador', 'Treinador', [...TREINADOR, FINANCEIRO]));
  } else if (area === 'GESTOR' && ctx.gestor?.ctStatus === 'ACTIVE') {
    sections.push(section('gestao', 'Gestão do Clube', [...GESTAO, TORNEIOS, FINANCEIRO]));
  } else if (area === 'ANOTADOR' && ctx.canOperate) {
    sections.push(section('operacao', 'Operação', OPERACAO));
  } else if (area === 'ADMIN' && ctx.isAdmin) {
    sections.push(section('admin', 'Admin', [ADMIN]));
  }
  sections.push(section('rodape', 'Conta', [DADOS_PESSOAIS, SAIR]));
  return dedupeKeepLast(sections);
}

export function buildMenu(ctx: MenuContext): MenuSection[] {
  if (!ctx.isActive || ctx.mustChangePassword) return [];
  if (ctx.activeArea) return buildMenuForArea(ctx, ctx.activeArea);

  const sections: MenuSection[] = [];
  if (canSeeOperation(ctx)) sections.push(section('operacao', 'Operação', OPERACAO));
  if (ctx.athlete) sections.push(section('atleta', 'Atleta', atletaItems(ctx.athlete)));
  if (ctx.coach) sections.push(section('treinador', 'Treinador', [...TREINADOR, FINANCEIRO]));
  if (ctx.gestor?.ctStatus === 'ACTIVE') sections.push(section('gestao', 'Gestão do Clube', [...GESTAO, TORNEIOS, FINANCEIRO]));
  if (ctx.isAdmin) sections.push(section('admin', 'Admin', [ADMIN]));
  sections.push(section('rodape', 'Conta', [DADOS_PESSOAIS, SAIR]));

  return dedupeKeepLast(sections);
}
