# Plano de Implementação: LGPD, Proteção de Menores e Governança do Sistema

> **Status:** Aprovado para Execução  
> **Data:** 2026-10-31  
> **Metodologia:** STE-DEV (Camadas estritas, arquivos $\le 100$ linhas, testes 100% verdes, sem regressão)  
> **Legislação de Referência:** LGPD (Lei 13.709/2018), ECA Digital (Lei 15.211/2025) e Enunciado ANPD 1/2023.

---

## 1. Visão Geral e Objetivos

O objetivo deste plano é garantir que o sistema RKT opere em conformidade legal com os padrões da LGPD e as exigências estritas de proteção a crianças e adolescentes no ambiente digital (ECA Digital), cobrindo:
1. **Proteção de Menores na Transmissão**: Mascaramento obrigatório de nomes de menores de 18 anos sem consentimento explícito `BROADCAST` do responsável legal.
2. **Fluxo Seguro de Tutela**: Vínculos de dependentes (`GuardianLink`) validados unicamente pelo responsável legal autenticado, eliminando autorizações pelo menor.
3. **Direitos dos Titulares (Art. 18 LGPD)**: Anonimização profunda da ficha civil do atleta (`Player`) e exportação integral de histórico esportivo com dados de adversários minimizados.
4. **Governança & Roteamento**: Aceite auditável de Termos e Privacidade no cadastro, leitura de parâmetros de perfil (`?perfil=`) e correção de navegação de convidados.

---

## 2. Diagnóstico da Arquitetura e Modelos Existentes

O banco de dados (Prisma / PostgreSQL) **já possui** as estruturas necessárias, dispensando qualquer migração estrutural:
- **`GuardianLink`**: Vínculo entre responsável (`guardianUserId`) e dependente (`playerId`), com estados `confirmedAt` e `revokedAt`.
- **`ConsentRecord`**: Registro de consentimento com finalidades tipadas via enum `ConsentPurpose` (`DATA` e `BROADCAST`), versão dos termos, `ipHash` e timestamps.
- **`AuditLog`**: Estrutura imutável para rastreamento de ações (`action`, `actorUserId`, `meta: Json`, `ipHash`).

---

## 3. Cobertura por Camada da Pilha Técnica

```
┌────────────────────────────────────────────────────────┐
│ UI / FRONTEND                                          │
│ - Páginas /termos e /privacidade                       │
│ - Checkbox legal e leitura de ?perfil= no /signup      │
│ - Botões de retorno corrigidos para /                  │
│ - Toggle de autorização de transmissão do responsável  │
├────────────────────────────────────────────────────────┤
│ APIS / ENDPOINTS                                       │
│ - GET  /api/spectate/[matchId]/feed (filtro broadcast) │
│ - POST /api/guardian/consent (grava/revoga)            │
│ - POST /api/users/[id]/anonymize (User + Player)       │
│ - GET  /api/users/[id]/export (com histórico)          │
├────────────────────────────────────────────────────────┤
│ BACKEND / CORE                                         │
│ - spectator-projection.ts (mascaramento de menores)    │
│ - age.ts / guardian-logic.ts (validação de maioridade) │
│ - user-anonymize.logic.ts / user-export.logic.ts       │
├────────────────────────────────────────────────────────┤
│ BANCO DE DADOS (Prisma)                                │
│ - GuardianLink (tutela)                                │
│ - ConsentRecord (DATA / BROADCAST)                     │
│ - AuditLog (aceites de termos e operações de dados)    │
└────────────────────────────────────────────────────────┘
```

---

## 4. Fases de Execução

### Fase 1: Proteção de Menores no Acompanhamento ao Vivo & Ergonomia de Convite
- **Prioridade:** P1 (Risco Crítico / ECA Digital)
- **Escopo Técnico:**
  1. **`src/core/spectate/spectator-projection.ts` & `spectator-feed.service.ts`**:
     - No pipeline de projeção ao vivo, verificar se o atleta é menor de idade (`isMinor`).
     - Se menor e sem registro ativo de `ConsentRecord` com `purpose: 'BROADCAST'`, projetar obrigatoriamente nome mascarado (`A. S.`) no placar, timeline e convite.
  2. **`src/app/matches/convite/[token]/page.tsx` & `src/app/matches/acompanhar/[matchId]/page.tsx`**:
     - Ajustar o botão "Voltar ao início" nas telas de convite inválido/lotado para direcionar à raiz pública `/` (em vez de forçar `/dashboard` e redirecionar para login).
- **Critério de Aceite:**
  - Testes unitários comprovando mascaramento de menores sem consentimento e liberação quando houver autorização ativa.

---

### Fase 2: Direitos dos Titulares — Anonimização Completa e Exportação (Art. 18 LGPD)
- **Prioridade:** P2 (Obrigação Legal LGPD)
- **Escopo Técnico:**
  1. **`src/app/api/users/[id]/anonymize`**:
     - Criar `user-anonymize.logic.ts` ($\le 100$ linhas).
     - Além da tabela `User`, localizar registros na tabela `Player` vinculados ao usuário e ofuscar dados civis (`name: 'Atleta Anonimizado'`, `cpf: null`, data de nascimento neutra).
     - Preservar integridade das partidas para não corromper o histórico do adversário.
  2. **`src/app/api/users/[id]/export`**:
     - Criar `user-export.logic.ts` ($\le 100$ linhas).
     - Exportar dados cadastrais + histórico de partidas/sets disputados, minimizando dados de adversários no relatório.
  3. **`AuditLog`**:
     - Gravar logs imutáveis das operações (`USER_ANONYMIZED` e `USER_DATA_EXPORTED`).
- **Critério de Aceite:**
  - Testes de integração cobrindo exclusão em cascata e integridade do adversário.

---

### Fase 3: Fluxo Seguro de Tutela e Consentimento (`GuardianLink` & `ConsentRecord`)
- **Prioridade:** P3 (Segurança e Validação)
- **Escopo Técnico:**
  1. **Cadastro de Menor por CT / Treinador**:
     - Formulário exige e-mail/contato do responsável se `birthDate < 18`.
     - Vínculo `GuardianLink` criado com `confirmedAt: null` (pendente).
  2. **Endpoint de Consentimento (`POST /api/guardian/consent`)**:
     - Criar rota dedicada para o responsável autenticado aprovar vínculo e alternar autorizações `DATA` e `BROADCAST`.
     - Gravar registro com `termsVersion`, `ipHash` e timestamp.
  3. **Emancipação Automática**:
     - No momento em que o atleta completa 18 anos, cessar automaticamente as restrições de tutela no Core Access.
- **Critério de Aceite:**
  - Testes garantindo que menores não podem aprovar seus próprios responsáveis.

---

### Fase 4: Onboarding, Parâmetros e Páginas Legais no Sistema
- **Prioridade:** P4 (Conformidade Institucional)
- **Escopo Técnico:**
  1. **Pré-seleção no Cadastro (`/signup?perfil=`)**:
     - Leitura de query param com validação estrita por whitelist (`ATLETA`, `TREINADOR`, `GESTOR`, `ESPECTADOR`), caindo em `ATLETA` para valores inválidos.
     - Captura opcional de `?origem=` para métricas de conversão.
  2. **Páginas Institucionais (`/termos` e `/privacidade`)**:
     - Criar rotas públicas `src/app/termos/page.tsx` e `src/app/privacidade/page.tsx` com visual nativo do design system.
     - Checkbox de aceite obrigatório no `/signup` registrando aceite em `AuditLog(action: 'TERMS_ACCEPTED')`.
- **Critério de Aceite:**
  - Páginas navegáveis e cadastro registrando timestamp/versão dos termos.

---

## 5. Resumo de Arquivos e Metodologia STE-DEV

Todos os módulos criados ou modificados respeitam:
- Teto de **100 linhas por arquivo** (Regra R-03).
- Tipagem estrita com TypeScript (`tsc --noEmit` com 0 erros).
- Testes unitários/integração cobrindo 100% dos caminhos críticos.

