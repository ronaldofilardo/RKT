import {
  ADMIN, DADOS_PESSOAIS, FINANCEIRO, GESTAO, OPERACAO, SAIR, TORNEIOS, TREINADOR,
  atletaItems,
} from './menu-items';
import type { MenuContext, MenuItem, MenuSection, MenuSectionKey } from './menu-types';

function section(key: MenuSectionKey, title: string, items: readonly MenuItem[]): MenuSection {
  return { key, title, items: items.map((item) => ({ ...item })) };
}

/**
 * Operação aparece para quem opera (`canOperate`) ou tem vínculo de atleta,
 * treinador ou gestor: a matriz (`PROFILE_MATRIX`) concede `OPERATE` a todos eles.
 */
function canSeeOperation(ctx: MenuContext): boolean {
  return ctx.canOperate && !ctx.coach && !(ctx.gestor?.ctStatus === 'ACTIVE') && !ctx.isAdmin && !ctx.isSuporte;
}

/** Item repetido (ex.: Financeiro) fica só na última seção, a de maior alcance. */
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

/**
 * Menu = soma das seções dos vínculos da conta (ADR-0009), na ordem:
 * Operação → Atleta → Treinador → Gestão do Clube → Admin → rodapé.
 * Função pura; o menu orienta, a API protege (`can()`).
 */
export function buildMenu(ctx: MenuContext): MenuSection[] {
  if (!ctx.isActive || ctx.mustChangePassword) return [];

  const sections: MenuSection[] = [];
  if (canSeeOperation(ctx)) sections.push(section('operacao', 'Operação', OPERACAO));
  if (ctx.athlete) sections.push(section('atleta', 'Atleta', atletaItems(ctx.athlete)));
  if (ctx.coach) {
    sections.push(section('treinador', 'Treinador', [...TREINADOR, FINANCEIRO]));
  }
  if (ctx.gestor?.ctStatus === 'ACTIVE') {
    sections.push(section('gestao', 'Gestão do Clube', [...GESTAO, TORNEIOS, FINANCEIRO]));
  }
  if (ctx.isAdmin) sections.push(section('admin', 'Admin', [ADMIN]));
  sections.push(section('rodape', 'Conta', [DADOS_PESSOAIS, SAIR]));

  return dedupeKeepLast(sections);
}
