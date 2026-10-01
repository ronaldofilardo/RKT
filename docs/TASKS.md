# 📋 Tarefas do Projeto RKT

> **Última atualização:** 2025-01-01  
> **Fonte única de verdade para o backlog do projeto.**

---

## 1. Tarefas Críticas de Testes

### C1. Implementar testes de integração para rotas de API ⏳
- **Prioridade:** Alta
- **Contexto:** 25 rotas API sem cobertura de integração
- **DoD:** Suite Playwright rodando em CI com >80% de cobertura das rotas críticas

### C2. Corrigir implementação de RLS no Supabase 🔴
- **Prioridade:** Crítica
- **Contexto:** Políticas RLS desabilitadas em produção (security gap)
- **DoD:** Todas as tabelas com RLS ativo + testes de autorização passando

### C3. Implementar testes de mutação (Stryker) ⏳
- **Prioridade:** Média
- **Contexto:** Mutation score atual desconhecido
- **DoD:** Stryker configurado, >70% mutation score em componentes core

---

## 2. Funcionalidades Ausentes (MVP Incompleto)

### A1. Página de Estatísticas do Jogador 🔴
- **Status:** Não iniciada
- **Rota:** `/players/[id]/stats`
- **DoD:** Exibir histórico de partidas, médias de pontos/rebotes/assistências

### A2. Exportação de Dados (PDF/Excel) 🔴
- **Status:** Não iniciada
- **Contexto:** Requisito do PRD não implementado
- **DoD:** Exportar relatórios de partidas e estatísticas em PDF e Excel

### A3. Notificações em Tempo Real 🔴
- **Status:** Não iniciada
- **Contexto:** Supabase Realtime disponível mas não utilizado
- **DoD:** Notificações de eventos de partida via WebSocket

### A4. Filtros Avançados (Partidas/Jogadores) ⏳
- **Status:** Parcial (filtro básico existe)
- **DoD:** Filtros por data, clube, estatísticas, status da partida

### A5. Modo Offline (Service Worker) 🔴
- **Status:** Removido em 2025-08-02
- **Decisão:** Reavaliar necessidade com usuários reais

### A6. Gestão de Temporadas 🔴
- **Status:** Modelo existe (tabela `Season`) mas sem UI
- **DoD:** CRUD de temporadas + associação com partidas

### A7. Sistema de Permissões Granulares 🔴
- **Status:** Apenas 2 roles (ADMIN/ANNOTATOR)
- **Contexto:** `specs/` mencionava 4 roles não implementados
- **DoD:** Definir modelo real de permissões baseado em uso

---

## 3. Débito Técnico Arquitetural

### A8. Separar lógica de negócio dos componentes React ⏳
- **Prioridade:** Alta
- **Contexto:** Componentes com 300+ linhas misturando UI e lógica
- **DoD:** Camada de serviços/hooks customizados extraída

### A9. Implementar tratamento de erro global ✅
- **Prioridade:** Alta
- **Status:** Concluído no core da aplicação (2026-07-20 / Onda 1 Guardrails)
- **Implementado:** `handleApiError` (`src/lib/api-helpers.ts`), hierarquia tipada de `ApiError` (`src/lib/errors.ts`) cobrindo 100% das APIs (18+ rotas), além de `src/app/error.tsx` e `src/app/global-error.tsx`.
- **Pendência residual:** Integração com APM externo (Sentry) rastreada em TD-022.

### A10. Adicionar loading states consistentes 🔴
- **Prioridade:** Média
- **Contexto:** Algumas telas sem feedback visual durante requests
- **DoD:** Skeleton loaders em todas as telas de dados

### A11. Refatorar `MatchProvider` (200+ linhas) ⏳
- **Prioridade:** Média
- **Contexto:** Context com múltiplas responsabilidades
- **DoD:** Separar em sub-contexts (scoreboard, timeline, players)

### A12. Implementar versionamento de API ⏳
- **Prioridade:** Baixa
- **Contexto:** Rotas API sem versionamento (`/api/v1/...`)
- **DoD:** Prefixo v1 + estratégia de deprecação documentada

### A13. Migrar de CSS Modules para Tailwind puro 🔴
- **Status:** Híbrido (alguns componentes ainda usam `.module.css`)
- **DoD:** Remover todos os arquivos `.module.css`

---

## 4. Refatoração e Limpeza

### R1. Remover comentários de código morto ✅
- **Arquivos:** `MatchCard.tsx`, `PlayerForm.tsx`, `ScoreboardDisplay.tsx`
- **Estimativa:** 1h

### R2. Consolidar utilitários duplicados ⏳
- **Contexto:** Funções de formatação de data/hora espalhadas em 5 arquivos
- **DoD:** Centralizar em `src/lib/utils/datetime.ts`

### R3. Renomear variáveis de estado inconsistentes ⏳
- **Exemplos:** `isOpen` vs `open`, `isLoading` vs `loading`
- **DoD:** Seguir convenção única (`is*` para booleans)

### R4. Extrair constantes mágicas ⏳
- **Contexto:** Números hardcoded (ex: `timeout: 5000`, `maxPlayers: 15`)
- **DoD:** Mover para `src/config/constants.ts`

### R5. Remover imports não utilizados ✅
- **Contexto:** ESLint detecta mas não corrige automaticamente
- **Comando:** `pnpm lint --fix`

### R6. Padronizar nomes de props de componentes ⏳
- **Contexto:** Alguns usam `onClick`, outros `onPress`, outros `handleClick`
- **DoD:** Seguir convenção React padrão (`on*` para callbacks)

### R7. Simplificar condicionais aninhadas ⏳
- **Arquivos:** `ScoringPanel.tsx` (5 níveis de `if`), `MatchTimeline.tsx`
- **DoD:** Refatorar para early returns ou guard clauses

### R8. Remover `console.log` de produção ✅
- **Contexto:** 47 ocorrências em código de produção
- **DoD:** Substituir por logger apropriado ou remover

### R9. Consolidar tipos TypeScript duplicados ⏳
- **Contexto:** `Match`, `MatchData`, `MatchDTO` coexistem
- **DoD:** Tipo canônico único + aliases quando necessário

### R10. Remover arquivos `.test.skip.ts` ⏳
- **Contexto:** Testes desabilitados acumulando
- **DoD:** Corrigir e habilitar ou documentar por que skip

### R11. Limpar diretórios vazios ✅
- **Pastas:** `src/app/telemetry/`, `src/components/ui/`, `src/components/telemetry/`, `src/test/`
- **Comando:** Script de cleanup já remove

---

## 5. Débito Técnico (50 itens do TECH_DEBT.md)

### 5.1 Segurança e Autenticação (Prioridade: Crítica)

#### TD-001. Implementar CSRF protection em forms 🔴
- **Risco:** Alto
- **Impacto:** Vulnerabilidade a ataques CSRF
- **Solução:** Tokens CSRF em todos os formulários POST/PUT/DELETE

#### TD-002. Adicionar rate limiting nas rotas de API 🔴
- **Risco:** Alto
- **Impacto:** Vulnerável a DDoS e abuso
- **Solução:** Middleware com `@upstash/ratelimit` ou similar

#### TD-003. Habilitar RLS (Row Level Security) no Supabase 🔴
- **Risco:** Crítico
- **Impacto:** Dados acessíveis sem autorização adequada
- **Solução:** Políticas RLS por tabela + testes de autorização
- **Nota:** Duplica C2, priorizar

#### TD-004. Implementar rotação de secrets/tokens ⏳
- **Risco:** Médio
- **Impacto:** Tokens de longa duração aumentam risco de comprometimento
- **Solução:** Política de rotação automática + vault

#### TD-005. Adicionar Content Security Policy headers 🔴
- **Risco:** Médio
- **Impacto:** XSS, clickjacking
- **Solução:** CSP headers em `next.config.js`

### 5.2 Performance e Otimização (Prioridade: Alta)

#### TD-006. Completar paginação por cursor em endpoints de listagem ⏳
- **Risco:** Médio
- **Status:** Parcial (rotas principais concluídas)
- **Implementado:** Paginação por cursor via Zod (`cursor`, `limit` max 100) e envelope `{ data: { [items], nextCursor } }` em `GET /api/matches`, `GET /api/players` e `GET /api/admin/users`.
- **Pendência:** Adicionar paginação nos endpoints secundários:
  - `GET /api/matches/suspended-sessions`
  - `GET /api/matches/tournament-suggestions`

#### TD-007. Adicionar cache de queries frequentes ⏳
- **Risco:** Baixo
- **Impacto:** Latência alta em dashboards
- **Solução:** React Query com staleTime configurado

#### TD-008. Otimizar bundle size (atualmente ~800KB) ⏳
- **Risco:** Baixo
- **Impacto:** FCP/LCP ruins em conexões lentas
- **Solução:** Code splitting, dynamic imports, tree shaking

#### TD-009. Implementar imagens otimizadas (Next.js Image) ⏳
- **Contexto:** Algumas imagens ainda usam `<img>` raw
- **Solução:** Migrar para `next/image` com loading lazy

#### TD-010. Adicionar service worker para cache estático 🔴
- **Contexto:** PWA foi removido
- **Decisão:** Reavaliar com usuários reais

### 5.3 Qualidade de Código (Prioridade: Média)

#### TD-011. Aumentar cobertura de testes unitários (atual: ~40%) ⏳
- **Meta:** >70% coverage em `src/lib/` e `src/hooks/`
- **Prioridade:** Funções de cálculo de estatísticas primeiro

#### TD-012. Adicionar testes E2E para fluxos críticos 🔴
- **Fluxos:** Login → Criar partida → Anotar evento → Finalizar
- **Ferramenta:** Playwright (já configurado)

#### TD-013. Implementar testes de acessibilidade automatizados ⏳
- **Ferramenta:** axe-core ou jest-axe
- **Meta:** Zero violações WCAG AA

#### TD-014. Adicionar validação de schemas Zod nas APIs restantes ⏳
- **Contexto:** Parte das rotas de API já foi migrada para `validatedRequest(request, Schema)` com Zod (`src/schemas/contracts.ts`), mas endpoints operacionais ainda possuem validações manuais.
- **Concluídas:** `POST /api/players`, `GET /api/players`, `POST /api/admin/users`, `POST /api/matches`, `POST /api/auth/login`.
- **APIs Pendentes (DoD):**
  - `POST /api/matches/[id]/point` (Prioridade: Média)
  - `POST /api/matches/[id]/finish` (Prioridade: Média)
  - `PATCH /api/matches/[id]/state` (Prioridade: Média)
  - `POST /api/matches/[id]/sessions` (Prioridade: Baixa)
  - `POST /api/matches/[id]/sessions/:sessionId/endorse` (Prioridade: Baixa)
  - `POST /api/matches/[id]/sessions/:sessionId/abandon` (Prioridade: Baixa)
  - `GET /api/matches/suspended-sessions` (Prioridade: Baixa)
  - `GET /api/matches/tournament-suggestions` (Prioridade: Baixa)

#### TD-015. Documentar decisões arquiteturais (ADRs) ✅
- **Status:** Concluído
- **Decisão:** ADRs consolidadas diretamente na fonte única da verdade em `docs/ARCHITECTURE.md` §6.

### 5.4 UX e Acessibilidade (Prioridade: Média)

#### TD-016. Adicionar feedback visual em ações assíncronas 🔴
- **Contexto:** Botões sem loading state
- **Solução:** Spinner/disabled durante requests

#### TD-017. Implementar modo escuro completo ⏳
- **Contexto:** Tokens de cor existem mas alguns componentes não respeitam
- **Solução:** Auditoria + correção de cores hardcoded

#### TD-018. Melhorar mensagens de erro para usuários ⏳
- **Contexto:** Erros técnicos expostos ("FK constraint failed")
- **Solução:** Mapeamento de erros para mensagens amigáveis

#### TD-019. Adicionar estados vazios em listas ⏳
- **Contexto:** Telas vazias sem orientação
- **Solução:** Empty states com call-to-action

#### TD-020. Implementar keyboard navigation completa ⏳
- **Contexto:** Alguns componentes não navegáveis por teclado
- **Meta:** Todas as ações acessíveis via Tab/Enter/Escape

### 5.5 Infraestrutura e DevOps (Prioridade: Baixa)

#### TD-021. Configurar CI/CD completo ⏳
- **Contexto:** GitHub Actions existe mas incompleto
- **Faltando:** Deploy automático, testes E2E no CI

#### TD-022. Adicionar monitoring e observability 🔴
- **Contexto:** Sem logs centralizados ou métricas
- **Solução:** Sentry (erros) + Vercel Analytics (performance)

#### TD-023. Implementar backup automático do banco ⏳
- **Contexto:** Supabase tem backups, mas não testados
- **Solução:** Script de restore + teste trimestral

#### TD-024. Adicionar health checks nas APIs 🔴
- **Contexto:** Sem endpoint `/health` ou `/ready`
- **Solução:** Rota que verifica DB + serviços externos

#### TD-025. Configurar ambientes de staging 🔴
- **Contexto:** Deploy direto para produção
- **Solução:** Preview deployments (Vercel já oferece)

### 5.6 Manutenibilidade (Prioridade: Baixa)

#### TD-026. Adicionar changelog automático ⏳
- **Ferramenta:** conventional-changelog
- **Gatilho:** Release tags

#### TD-027. Documentar setup de desenvolvimento ⏳
- **Contexto:** README básico sem troubleshooting
- **Necessário:** Guia de primeiro setup, requisitos, FAQ

#### TD-028. Criar scripts de seed para desenvolvimento 🔴
- **Contexto:** Desenvolvedores criam dados manualmente
- **Solução:** `pnpm db:seed` com dados fake realistas

#### TD-029. Adicionar linting de commits (commitlint) ⏳
- **Contexto:** Mensagens de commit inconsistentes
- **Solução:** Husky + commitlint (Husky não está configurado ainda)

#### TD-030. Implementar pre-commit hooks ⏳
- **Contexto:** Código não-lintado chega no Git
- **Solução:** lint-staged + Husky (requer configuração de `.husky/`)

### 5.7 Itens Rápidos (<2h cada) ✅

#### TD-031. Corrigir warnings do ESLint (34 warnings) ✅
- **Comando:** `pnpm lint --fix`

#### TD-032. Atualizar dependências com vulnerabilidades ✅
- **Comando:** `pnpm audit fix`

#### TD-033. Remover imports não utilizados ✅
- **Ferramenta:** ESLint autofix

#### TD-034. Corrigir typos em comentários/docs ✅
- **Ferramenta:** cSpell ou manual

#### TD-035. Adicionar `.editorconfig` para consistência ⏳
- **Conteúdo:** indent_style, charset, trim_trailing_whitespace

### 5.8 Refatorações Estruturais (>1 dia cada) ⏳

#### TD-036. Migrar de Pages Router para App Router (Next.js 15) 🔴
- **Contexto:** Projeto usa App Router, mas alguns padrões são de Pages
- **Esforço:** Alto
- **Decisão:** Validar se já está em App Router

#### TD-037. Implementar feature flags ⏳
- **Contexto:** Features experimentais sem toggle
- **Solução:** LaunchDarkly ou similar

#### TD-038. Separar monorepo (frontend/backend) 🔴
- **Contexto:** Tudo em um único package
- **Decisão:** Avaliar necessidade real

#### TD-039. Adicionar internacionalização (i18n) 🔴
- **Contexto:** App em português hardcoded
- **Prioridade:** Baixa até ter usuários internacionais

#### TD-040. Implementar design system standalone 🔴
- **Contexto:** Componentes não reutilizáveis fora do projeto
- **Solução:** Storybook + pacote NPM separado

### 5.9 Melhorias de DX (Developer Experience) ⏳

#### TD-041. Adicionar snippets VSCode para componentes ⏳
- **Contexto:** Boilerplate manual
- **Solução:** `.vscode/snippets.json`

#### TD-042. Configurar debug profiles para VSCode ⏳
- **Contexto:** Desenvolvedores usam `console.log` excessivamente
- **Solução:** `.vscode/launch.json` para Next.js

#### TD-043. Adicionar git hooks para validação de branches ⏳
- **Contexto:** Branches com nomes inconsistentes
- **Solução:** Padrão `feat/`, `fix/`, `chore/`

#### TD-044. Implementar gerador de componentes (plop.js) ⏳
- **Contexto:** Boilerplate manual para novos componentes
- **Comando:** `pnpm generate:component`

#### TD-045. Adicionar aliases de import mais curtos ⏳
- **Contexto:** Imports relativos profundos (`../../../`)
- **Solução:** `@components`, `@lib`, `@hooks` em `tsconfig.json`

### 5.10 Outros (Prioridade: Avaliar) 🔴

#### TD-046. Avaliar necessidade de GraphQL vs REST ⏳
- **Contexto:** Overfetching em algumas telas
- **Decisão:** Reavaliar com métricas reais

#### TD-047. Implementar retry logic em requests ⏳
- **Contexto:** Falhas de rede não recuperáveis
- **Solução:** Exponential backoff

#### TD-048. Adicionar telemetria de uso (analytics) 🔴
- **Contexto:** Sem dados de comportamento do usuário
- **Solução:** PostHog ou Mixpanel (compliance LGPD)

#### TD-049. Implementar versionamento de banco de dados ⏳
- **Contexto:** Migrações Prisma sem rollback strategy
- **Solução:** Documentar processo de rollback

#### TD-050. Criar roadmap público ⏳
- **Contexto:** Usuários sem visibilidade de próximas features
- **Solução:** GitHub Projects público

---

## 6. Melhorias e Otimizações

### M1. Melhorar UX do cronômetro de partida ⏳
- **Contexto:** Feedback de usuários sobre dificuldade de pausar/retomar
- **Solução:** Botões maiores, confirmação antes de finalizar

### M2. Adicionar busca global (Cmd+K) ⏳
- **Contexto:** Navegação entre partidas/jogadores lenta
- **Solução:** Command palette estilo Spotlight

### M3. Implementar atalhos de teclado para anotação ⏳
- **Contexto:** Anotadores perdem tempo clicando
- **Solução:** Hotkeys para eventos comuns (1=ponto, 2=rebote, etc.)

### M4. Adicionar gráficos de tendência nas estatísticas ⏳
- **Contexto:** Apenas tabelas, sem visualização
- **Solução:** Recharts ou similar

### M5. Melhorar onboarding de novos usuários ⏳
- **Contexto:** Taxa de abandono alta no primeiro uso
- **Solução:** Tour guiado interativo

---

## 7. Itens de Backlog (Não Iniciados)

### N1. Sistema de notificações push 🔴
- **Escopo:** Notificar usuários de eventos importantes via browser/mobile

### N2. Exportação personalizada de relatórios 🔴
- **Escopo:** Usuário escolhe métricas e formato (PDF/Excel/CSV)

### N3. Integração com redes sociais (compartilhar resultados) 🔴
- **Escopo:** Botão "Compartilhar" gerando card visual

### N4. Sistema de convites/gestão de equipe 🔴
- **Escopo:** Admins convidam anotadores por email

### N5. Histórico de alterações (audit log) 🔴
- **Escopo:** Registro de quem editou o quê e quando

### N6. Modo de treino/simulação 🔴
- **Escopo:** Ambiente sandbox para testar anotação sem afetar dados reais

### N7. Suporte a múltiplos esportes 🔴
- **Escopo:** Generalizar para vôlei, futebol, etc.
- **Decisão:** Fora do escopo MVP

### N8. API pública para integrações 🔴
- **Escopo:** Endpoints REST documentados + autenticação via API key

### N9. White-label/customização visual 🔴
- **Escopo:** Clubes personalizarem cores/logo

### N10. Análise preditiva (Machine Learning) 🔴
- **Escopo:** Prever resultados baseado em histórico
- **Decisão:** Fora do roadmap atual

### N11. Mobile app nativo (React Native) 🔴
- **Escopo:** App iOS/Android
- **Decisão:** PWA suficiente por enquanto

---

## Legenda de Status

- 🔴 **Não Iniciada** - Aguardando priorização
- ⏳ **Em Andamento** - Trabalho ativo ou parcialmente completo
- ✅ **Concluída** - Implementada e validada

---

**Próximos passos sugeridos:**
1. Executar C2 (RLS) - risco crítico de segurança
2. Completar A1 (Estatísticas) - feature mais requisitada
3. Resolver TD-001 a TD-005 (segurança)
4. Aumentar cobertura de testes (C1, TD-011, TD-012)
