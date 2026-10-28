import { buildMenu } from '../menu';
import type { MenuContext, MenuSection } from '../menu-types';

function ctx(over: Partial<MenuContext> = {}): MenuContext {
  return {
    isActive: true,
    mustChangePassword: false,
    canOperate: false,
    isAdmin: false,
    isSuporte: false,
    gestor: null,
    coach: null,
    athlete: null,
    ...over,
  };
}

const keys = (menu: MenuSection[]) => menu.map((s) => s.key).filter((k) => k !== 'rodape');
const find = (menu: MenuSection[], key: string) => menu.find((s) => s.key === key);
const itemKeys = (menu: MenuSection[]) => menu.flatMap((s) => s.items.map((i) => i.key));
const gestorActive = { ctIds: ['ct-1'], ctStatus: 'ACTIVE' as const };
const adult = { playerId: 'p-1', ctIds: [], isMinor: false };

describe('buildMenu — combinações do plano (§7)', () => {
  it('1. anotador atual: só Operação, mesmas rotas e ordem do menu vigente', () => {
    const menu = buildMenu(ctx({ canOperate: true }));
    expect(keys(menu)).toEqual(['operacao']);
    const op = find(menu, 'operacao')!;
    expect(op.items.map((i) => i.label)).toEqual([
      'Início', 'Histórico', 'Partidas Anotadas', 'Ao Vivo', 'Aguardando', 'Atletas', 'Nova Partida',
    ]);
    expect(op.items.map((i) => i.href)).toEqual([
      '/dashboard', '/historico', '/partidasanotadas', '/partidasaovivo', '/aguardandoanotador', '/atletas', '/match/new',
    ]);
    expect(itemKeys(menu)).toContain('aguardando');
  });

  it('2. ADMIN: Admin (sem Operação porque isAdmin)', () => {
    expect(keys(buildMenu(ctx({ canOperate: true, isAdmin: true })))).toEqual(['admin']);
    const soAdmin = buildMenu(ctx({ isAdmin: true }));
    expect(keys(soAdmin)).toEqual(['admin']);
    expect(find(soAdmin, 'admin')!.items).toEqual([
      expect.objectContaining({ label: 'Admin', href: '/admin' }),
    ]);
  });

  it('3. Suporte puro: só Suporte, com Financeiro desabilitado', () => {
    const menu = buildMenu(ctx({ isSuporte: true }));
    expect(keys(menu)).toEqual(['suporte']);
    const fin = find(menu, 'suporte')!.items.find((i) => i.key === 'financeiro');
    expect(fin).toEqual(expect.objectContaining({ disabled: true, badge: 'Em breve' }));
  });

  it('4. Gestor com CT ACTIVE: Gestão do Clube (sem Operação)', () => {
    const menu = buildMenu(ctx({ gestor: gestorActive }));
    expect(keys(menu)).toEqual(['gestao']);
    expect(find(menu, 'gestao')!.items.map((i) => i.key)).toEqual([
      'gestao-visao-geral', 'gestao-treinadores', 'gestao-atletas', 'gestao-partidas',
      'gestao-clube', 'torneios', 'financeiro',
    ]);
  });

  it.each(['PENDING', 'SUSPENDED', null] as const)(
    '5. Gestor com CT %s: Operação (se pode operar), sem Gestão do Clube',
    (ctStatus) => {
      const menu = buildMenu(ctx({ canOperate: true, gestor: { ctIds: ['ct-1'], ctStatus } }));
      expect(keys(menu)).toEqual(['operacao']);
    },
  );

  it('6. Treinador avulso: Treinador (sem Operação)', () => {
    expect(keys(buildMenu(ctx({ coach: { ctIds: [] } })))).toEqual(['treinador']);
  });

  it('7. Treinador de clube: Treinador (sem Operação)', () => {
    expect(keys(buildMenu(ctx({ coach: { ctIds: ['ct-1'] } })))).toEqual(['treinador']);
  });

  it('8. Atleta avulso: "Vincular a clube"', () => {
    const menu = buildMenu(ctx({ canOperate: true, athlete: adult }));
    expect(keys(menu)).toEqual(['operacao', 'atleta']);
    const clubes = find(menu, 'atleta')!.items.find((i) => i.key === 'atleta-clubes');
    expect(clubes).toEqual(expect.objectContaining({ label: 'Vincular a clube', href: '/atleta/clubes' }));
  });

  it('9. Atleta de clube: "Meus Clubes"', () => {
    const menu = buildMenu(ctx({ athlete: { ...adult, ctIds: ['ct-1'] } }));
    const clubes = find(menu, 'atleta')!.items.find((i) => i.key === 'atleta-clubes');
    expect(clubes!.label).toBe('Meus Clubes');
  });

  it('10. Responsáveis só para atleta menor de idade', () => {
    const menor = buildMenu(ctx({ athlete: { ...adult, isMinor: true } }));
    expect(itemKeys(menor)).toContain('atleta-responsaveis');
    expect(itemKeys(buildMenu(ctx({ athlete: adult })))).not.toContain('atleta-responsaveis');
  });

  it('11. Gestor + treinador + atleta: 3 seções (sem Operação) e Financeiro uma única vez (em Gestão)', () => {
    const menu = buildMenu(ctx({ canOperate: true, gestor: gestorActive, coach: { ctIds: [] }, athlete: adult }));
    expect(keys(menu)).toEqual(['atleta', 'treinador', 'gestao']);
    expect(itemKeys(menu).filter((k) => k === 'financeiro')).toHaveLength(1);
    expect(find(menu, 'gestao')!.items.some((i) => i.key === 'financeiro')).toBe(true);
    expect(find(menu, 'treinador')!.items.some((i) => i.key === 'financeiro')).toBe(false);
    expect(find(menu, 'gestao')!.items.find((i) => i.key === 'torneios')!.disabled).toBe(true);
  });

  it('12. Treinador + atleta: Atleta e Treinador (sem Operação; Financeiro em Treinador)', () => {
    const menu = buildMenu(ctx({ canOperate: true, coach: { ctIds: [] }, athlete: adult }));
    expect(keys(menu)).toEqual(['atleta', 'treinador']);
    expect(find(menu, 'treinador')!.items.some((i) => i.key === 'financeiro')).toBe(true);
  });

  it('13. mustChangePassword: menu oculto (só /trocar-senha)', () => {
    expect(buildMenu(ctx({ canOperate: true, mustChangePassword: true }))).toEqual([]);
  });

  it('14. Conta inativa: sem menu', () => {
    expect(buildMenu(ctx({ canOperate: true, isActive: false }))).toEqual([]);
  });
});

describe('buildMenu — regras gerais', () => {
  it('ordem fixa das seções com todos os perfis', () => {
    const menu = buildMenu(ctx({
      canOperate: true, isAdmin: true, isSuporte: true,
      gestor: gestorActive, coach: { ctIds: [] }, athlete: adult,
    }));
    expect(menu.map((s) => s.key)).toEqual([
      'atleta', 'treinador', 'gestao', 'suporte', 'admin', 'rodape',
    ]);
  });

  it('chaves de item são únicas em todo o menu', () => {
    const menu = buildMenu(ctx({
      canOperate: true, isAdmin: true, isSuporte: true,
      gestor: gestorActive, coach: { ctIds: [] }, athlete: adult,
    }));
    const all = itemKeys(menu);
    expect(new Set(all).size).toBe(all.length);
    expect(all.filter((k) => k === 'financeiro')).toHaveLength(1);
  });

  it('rodapé: Dados Pessoais e Sair (ação de logout, sem rota)', () => {
    const rodape = find(buildMenu(ctx({ canOperate: true })), 'rodape')!;
    expect(rodape.items[0]).toEqual(expect.objectContaining({ href: '/dados-pessoais' }));
    expect(rodape.items[1]).toEqual(expect.objectContaining({ key: 'sair', action: 'logout' }));
    expect(rodape.items[1].href).toBeUndefined();
  });

  it('itens desabilitados não têm rota e exibem "Em breve"', () => {
    const menu = buildMenu(ctx({ gestor: gestorActive, isSuporte: true }));
    const disabled = menu.flatMap((s) => s.items).filter((i) => i.disabled);
    expect(disabled.length).toBeGreaterThan(0);
    for (const item of disabled) {
      expect(item.href).toBeUndefined();
      expect(item.badge).toBe('Em breve');
    }
  });

  it('chamadas independentes não compartilham objetos (sem mutação cruzada)', () => {
    const a = buildMenu(ctx({ canOperate: true }));
    a[0].items[0].label = 'ALTERADO';
    const b = buildMenu(ctx({ canOperate: true }));
    expect(b[0].items[0].label).toBe('Início');
  });
});
