# Spike: Next.js 15.3 URL Rewrite & Client Navigation

> **Data:** 2026-11-01  
> **Status:** Concluído / Validado  
> **Fase:** 0 (Spike e Linha de Base)

## 1. Objetivo
Validar se o mecanismo de reescrita transparente (`NextResponse.rewrite`) no Next.js 15 App Router é compatível com:
1. O hook `usePathname()` em Client Components.
2. Navegação cliente via `<Link>` e `router.push`.
3. A pilha de modais controlada por URL (`useRouterModalStack`).

## 2. Comportamento Avaliado

### 2.1 `usePathname()` com URL Reescrita
No Next.js App Router (13.x a 15.x):
- O middleware recebe a requisição com o pathname público (ex.: `/treinador` ou `/atleta/partidasaovivo`).
- Ao emitir `NextResponse.rewrite(new URL('/dashboard', request.url))`, o Next.js serve a árvore de componentes de `/dashboard`, mas preserva o cabeçalho `x-matched-path` e a URL externa na barra de endereços do navegador.
- O hook `usePathname()` no cliente **retorna a URL externa/pública** (ex.: `/treinador`), e não a rota interna de disco (`/dashboard`).

### 2.2 Pilha de Modais (`useRouterModalStack`)
Apenas dois hooks em todo o codebase invocam `usePathname()`:
- `src/hooks/use-modal-stack-internal-state.ts`
- `src/hooks/use-modal-stack-router.ts`

Ambos utilizam `pathname` exclusivamente para concatenar `?modal=...` mantendo a rota base. Como `usePathname()` fornece a rota com prefixo de área (ex.: `/treinador`), ao abrir um modal o endereço torna-se `/treinador?modal=filtro`, sem qualquer vazamento da rota interna `/dashboard`.

### 2.3 Navegação `<Link>` e Prefetching
Ao clicar em `<Link href={appPath(area, '/partidasaovivo')}>`:
- O Next.js executa a transição SPA usando o cliente de rotas.
- O middleware reescreve a requisição para a rota interna correspondente com cabeçalhos de contexto limpos.
- Nenhum recarregamento completo de página (full-page reload) é disparado.

## 3. Conclusão do Spike
A estratégia de reescrita de URLs via Middleware é 100% viável e não requer nenhuma modificação no sistema de modais nem na estrutura fundamental de rotas do App Router.

