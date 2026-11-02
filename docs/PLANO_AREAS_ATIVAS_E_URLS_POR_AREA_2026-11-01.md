# Plano Detalhado: Área Ativa e URLs por Área

> **Status:** Planejado / Pronto para Execução  
> **Data:** 2026-11-01  
> **Substitui:** Ondas 4b e 5b (incorporando o isolamento por contexto do treinador e atleta)  
> **Premissas:** Somente código (sem migração estrutural nem toque em dados de produção), entrega modular por fase e preservação com arquivamento do legado.

---

## 1. Visão Geral e Problema Resolvido

Hoje, múltiplos perfis com dinâmicas e necessidades completamente distintas (Treinador de Clube, Treinador Avulso/Particular, Atleta de Clube, Atleta Avulso e Anotador) caem genericamente em `/dashboard`. Apenas Gestor (`/gestor`), Admin (`/admin`) e Suporte (`/suporte`) possuem rotas semânticas próprias.

Além disso, a análise detalhada identificou quatro correções fundamentais:
1. **Middleware Matcher**: O `matcher` atual não inclui `/login`, fazendo com que o redirecionamento de usuário já logado nunca seja disparado na raiz de autenticação.
2. **Defeito no Refresh Token**: O endpoint `/api/auth/refresh` atualmente reemite tokens contendo apenas `sub`, `role` e `sv`, descartando `pp`, `mk` e `mcp`. A preservação integral é pré-requisito deste plano.
3. **Tipo de Redirecionamento (307)**: Redirecionamentos de rotas antigas devem ser temporários (`307 Temporary Redirect`), pois a mesma rota antiga aponta para prefixos diferentes a depender da área ativa de cada usuário (evitando cacheamento indevido no cliente/navegador).
4. **Isolamento de Visibilidade**: Um treinador em múltiplos CTs ou com atletas particulares não pode misturar visões nem vazar partidas de outro contexto.

---

## 2. Desenho de Arquitetura: Áreas e Prefixos Canônicos

### 2.1 Matriz de Áreas e Mapeamento Interno

| Área | Prefixo na URL | Rota Interna (App Router) | Descrição do Perfil |
| :--- | :--- | :--- | :--- |
| **Admin** | `/admin` | `/admin` | Administração global da plataforma |
| **Suporte** | `/suporte` | `/suporte` | Gestão de suporte, onboarding e aprovação de CTs |
| **Gestor de Clube** | `/clube/gestor` (ou `/gestor`) | `/gestor` | Painel do Gestor de Clube/CT |
| **Treinador de Clube** | `/clube/treinador` | `/dashboard` (visão CT) | Treinador atuando em nome de um CT específico |
| **Treinador Particular** | `/treinador` | `/dashboard` (visão Avulso) | Treinador atuando com atletas particulares |
| **Atleta** | `/atleta` | `/dashboard` (visão Atleta) | Atleta (com clube ou avulso) |
| **Anotador** | `/anotador` | `/dashboard` (visão Operador) | Operador/Anotador de partidas |
| **Espectador** | `/espectador` | `/dashboard` (área residual) | Torcedor / Familiar com conta ativa |

### 2.2 Subpáginas Prefixadas vs. Páginas Neutras
- **Páginas com Prefixo de Área:**
  - `/<prefixo>/partidasanotadas`
  - `/<prefixo>/partidasaovivo`
  - `/<prefixo>/aguardandoanotador`
  - `/<prefixo>/historico`
  - `/<prefixo>/atletas`
  - `/<prefixo>/match/new`
  - `/<prefixo>/match/[id]/scoring`
  - `/<prefixo>/match/[id]/report`
- **Páginas Neutras (Sem Prefixo):**
  - `/login`, `/signup`, `/forgot`, `/trocar-senha`, `/dados-pessoais`
  - `/matches/*` (convites públicos, locate e acompanhamento ao vivo)
  - `/termos`, `/privacidade`
  - `/api/*`
  - `/escolher-area` (tela de seleção de contexto pós-login)

---

## 3. Segurança e Claims de Sessão (JWT)

Para permitir que o `middleware.ts` valide e reescreva URLs sem consultar o banco a cada requisição, o payload do token JWT passa a incluir:

```ts
interface SessionTokenPayload {
  sub: string;             // User ID
  role: string;            // Papel base da conta
  sv: number;              // Session Version
  mcp?: boolean;           // Must Change Password
  pp?: string[];           // Perfis (PROFILES)
  mk?: string[];           // Membership Kinds
  ax: string;              // Área ativa ('ADMIN' | 'SUPORTE' | 'GESTOR' | 'TREINADOR_CLUBE' | 'TREINADOR_AVULSO' | 'ATLETA' | 'ANOTADOR' | 'ESPECTADOR')
  ct?: string | null;      // ID do Clube/CT ativo (quando aplicável)
  ars: string[];           // Lista de códigos de áreas disponíveis para o usuário
}
```

> **Princípio Zero-Trust:** O token serve apenas para roteamento e autorização rápida no Middleware. O servidor backend revalida estritamente o vínculo do usuário contra o banco em todas as chamadas de API (`getActor(userId, areaContext)`).

---

## 4. Fluxo de Decisão do Middleware

```
[Requisição de Entrada]
       │
       ▼
É rota estática, asset (_next, public) ou neutra (/login, /signup, /termos, /api)?
       ├─► SIM ──► Continua normalmente
       ▼ NÃO
Possui token de sessão válido?
       ├─► NÃO ──► Redireciona para /login?next=<path_com_prefixo>
       ▼ SIM
Usuário com senha provisória (mcp === true)?
       ├─► SIM ──► Redireciona para /trocar-senha
       ▼ NÃO
URL já contém o prefixo da área ativa (ax)?
       ├─► SIM ──► Rewrite interno transparente para a rota do App Router
       ▼ NÃO
URL contém o prefixo de OUTRA área permitida para o usuário (ars)?
       ├─► SIM ──► Redireciona para a área ativa ou oferece troca de área
       ▼ NÃO
URL é uma rota antiga/não prefixada (/dashboard, /partidasaovivo, etc.)?
       └─► SIM ──► 307 Temporary Redirect para /<prefixo_ativo>/<subpagina>
```

---

## 5. Fases de Execução (STE-DEV)

### Fase 0: Spike de Compatibilidade e Linha de Base (P)
- **Objetivo:** Validar o comportamento de reescrita no Next.js 15.3 com:
  - `usePathname()` retornando o caminho visível na barra de endereços.
  - Prefetch de `<Link>` navegando suavemente entre rotas reescritas.
  - Pilha de modais (`use-modal-stack-*`) sem fechamentos inesperados.
- **Critério de Aceite:** Documento de spike atestando a integridade das APIs do cliente.

### Fase 1: Token, Claims e Correção de Sessão (M)
- **Objetivo:** Sanar o endpoint de refresh e incluir os novos claims.
- **Tarefas:**
  1. Corrigir `/api/auth/refresh` para preservar `pp`, `mk`, `mcp`, `ax`, `ct` e `ars`.
  2. Criar `src/core/access/areas.ts` ($\le 100$ linhas) com as funções puras:
     - `listAreas(meData)`
     - `homeForArea(area)`
     - `prefixForArea(area)`
  3. Atualizar `login-token-logic.ts` e `jwt-client.ts`.
  4. Criar endpoint `POST /api/auth/area` para troca de contexto sem logout com registro no `AuditLog`.
  5. Adicionar feature flag de compatibilidade `AREA_URLS`.

### Fase 2: Camada de Roteamento no Middleware e Helper `appPath` (G)
- **Objetivo:** Ativar reescrita de URLs sem quebrar rotas existentes.
- **Tarefas:**
  1. Criar helper puro `appPath(area, path)` em `src/core/access/app-path.logic.ts`.
  2. Modularizar o middleware criando `src/middleware-area.logic.ts` ($\le 100$ linhas).
  3. Expandir o `matcher` do middleware com exclusão explícita de assets e inclusão de `/login`.
  4. Implementar a tabela de redirecionamento 307 para caminhos legados.

### Fase 3: Isolamento por Área no Servidor (G)
- **Objetivo:** Garantir isolamento total de dados no backend conforme o contexto ativo.
- **Tarefas:**
  1. Atualizar `getActor(userId, areaContext)` para restringir memberships e segregação de clube.
  2. Aplicar filtro estrito por `Match.ctId` em `canReadMatch`, `canAnnotateMatch` e listagens de partidas.
  3. No contexto `TREINADOR_AVULSO`: `ctId = null` na criação de partidas e escopo de atletas restrito a `CoachAthleteLink` particular.

### Fase 4: Migração de Links e Teste-Guarda Automatizado (G)
- **Objetivo:** Substituir links hardcoded por `appPath`.
- **Tarefas:**
  1. Migrar links na ordem: Dashboard (`DashboardChrome`), Partidas (`match/new`, `scoring`, `report`), Atletas e Gestor.
  2. Criar teste-guarda de integridade (`area-links.guard.test.ts`) que falha automaticamente caso uma nova rota prefixável seja escrita sem o helper.

### Fase 5: Interface, Seletor de Área e Limpeza de Cache (M)
- **Objetivo:** Experiência visual de troca de área fluida.
- **Tarefas:**
  1. Tela `/escolher-area` exibida após o login (pulada automaticamente se o usuário tiver apenas uma área).
  2. Componente de TopBar com seletor de área ativo.
  3. Atualização do `buildMenu` para renderizar apenas as seções correspondentes à área ativa.
  4. Purga segura do cache offline (IndexedDB) na troca de área para prevenir vazamento de dados locais entre clubes.

### Fase 6: Páginas Públicas, Erros e Parâmetro `next` (P)
- **Objetivo:** Fechar lacunas de transição e segurança de redirecionamento.
- **Tarefas:**
  1. Validação estrita contra Open Redirect no parâmetro `next`.
  2. Telas de erro (`not-found`, `error`) integradas com o botão de retorno para a home da área ativa.
  3. Links compartilhados de relatório com diálogo de troca de área caso a partida pertença a outro contexto do usuário.

### Fase 7: Ativação Gradual e Desativação do Legado (P)
- **Objetivo:** Rollout seguro em produção.
- **Tarefas:**
  1. Habilitar `AREA_URLS=true` em ambiente local e executar suite de regressão completa.
  2. Ativação controlada em produção.
  3. Desativação gradual dos redirecionamentos temporários após janela de transição.

---

## 6. Matriz de Testes e Segurança

1. **Testes Unitários:**
   - Resolução de rotas em `appPath(area, path)` para todas as 8 áreas.
   - Cálculo de áreas em `listAreas(me)`.
2. **Matriz de Testes do Middleware:**
   - 8 áreas $\times$ tipos de caminho (home, prefixado, neutro, público, API, legado) $\times$ tipos de sessão (sem token, inválido, senha provisória, área válida, área não autorizada).
3. **Testes de Segurança:**
   - Tentativa de forjar `ax` de um clube onde o usuário não tem vínculo ativo (bloqueio 403 imediato).
   - Tentativa de open redirect via `?next=https://malicious.site`.
4. **Validação Contínua:**
   - Tipagem TypeScript (`tsc --noEmit`) com 0 erros.
   - Linter (`next lint`) com 0 warnings e 0 erros.
   - Regra R-03 ($\le 100$ linhas por arquivo) em 100% dos novos arquivos.

