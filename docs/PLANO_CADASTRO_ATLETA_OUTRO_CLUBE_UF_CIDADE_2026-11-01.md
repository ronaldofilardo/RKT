# 📋 Plano Executivo: Cadastro de Atleta de Outro Clube (UF, Cidade e Clube)

> **Documento:** `docs/PLANO_CADASTRO_ATLETA_OUTRO_CLUBE_UF_CIDADE_2026-11-01.md`  
> **Status:** Pronto para Execução  
> **Data:** 01/11/2026  
> **Metodologia:** STE-DEV (ASD-STE100 aplicada a software), R-03 ($\le 100$ linhas por arquivo), Telemetry Design System, Dual-Theme.

---

## 1. Visão Geral e Objetivos

Permitir que usuários cadastrem atletas pertencentes a **outros clubes** ou **avulsos/independentes**, registrando formalmente a sua procedência esportiva:
- **Estado (UF):** Lista padronizada dos 26 estados brasileiros + Distrito Federal (27 UFs).
- **Cidade:** Campo de texto livre (`city`).
- **Clube do Atleta:** Campo de texto livre (`club`), permitindo nomes de agremiações externas (ex.: "Clube Curitibano", "Esporte Clube Pinheiros", "Graciosa Country Club", "Avulso").

A demanda abrange 4 situações distintas com regras de negócio e permissões bem definidas:
1. **Gestor de Clube** (em `/clube/gestor` ou `/gestor`)
2. **Treinador de Clube** (em `/clube/treinador`)
3. **Treinador Avulso / Particular** (em `/treinador`, contexto `PARTICULAR`)
4. **Modal "Novo Atleta"** (na montagem de partidas em `/match/new` e na listagem em `/atletas`)

---

## 2. Regras de Negócio e Matriz de Decisão

### 2.1 Regra de Ouro do Pool Global
- Atleta pertence a um **pool global único** (`Player`).
- O vínculo com um CT ocorre exclusivamente pela tabela associativa `PlayerCT`.
- **Atleta de Outro Clube NÃO ganha `PlayerCT` com o clube do usuário que o cadastrou.** O atleta é registrado no pool com seus dados de procedência (`club`, `city`, `state`/`uf`) e `myClub: false`.

### 2.2 Comportamento Específico por Situação

| Situação | Padrão Inicial | Opção "Outro Clube" | Vínculo CT (`PlayerCT`) | Vínculo Treinador (`CoachAthleteLink`) | Exibição / Visibilidade |
|---|---|---|---|---|---|
| **1. Gestor** | Atleta do Clube | Toggle / Radio no modal | ❌ Não vincula ao CT do gestor | ❌ Não | Disponível para escalar em partidas contra atletas do clube |
| **2. Treinador de Clube** | Atleta do Clube | Checkbox "Do meu clube" desmarcado | ❌ Não vincula ao CT | Opcional | Disponível para confrontos e anotações |
| **3. Treinador Avulso** | Externo / Avulso | Exibido por padrão (campos livres) | ❌ Não vincula a nenhum CT | ✅ Sim (gera vínculo técnico do treinador com o atleta) | Acompanha no painel particular do treinador |
| **4. Modal `/match/new`** | Adversário = Outro Clube | Seletor de Origem | ❌ Não vincula | ❌ Não | Selecionado na partida com procedência broadcast |

---

## 3. Arquitetura e Modelagem

### 3.1 Lista Padronizada de UFs Brasileiras
Módulo puro centralizado em `src/core/athlete/brazilian-states.ts`:
```ts
export const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export type BrazilianUF = (typeof BRAZILIAN_UFS)[number];
```

### 3.2 Schemas Zod e Contratos
- Atualização de `CreatePlayerInputSchema` e `UpdatePlayerInputSchema` em `src/schemas/player.ts`:
  - `club: z.string().trim().max(100).optional()` (já existente)
  - `city: z.string().trim().max(100).optional()`
  - `state: z.enum(BRAZILIAN_UFS).optional()` ou `uf: z.enum(BRAZILIAN_UFS).optional()`
  - `isExternalClub: z.boolean().optional()`

### 3.3 Componentes Reutilizáveis de Formulário
- `src/app/atletas/components/athlete-origin-fields.tsx` ($\le 100$ linhas):
  - Componente visual padronizado com os tokens do **Telemetry Design System**:
    - Select de UF com visual `bg-telemetry-elevated border-white/10 text-telemetry-text-primary`.
    - Input de Cidade com placeholder *"Ex: Curitiba"*.
    - Input de Clube com placeholder *"Ex: Clube Curitibano"*.

---

## 4. Fases de Execução

### Fase 1: Módulo Central de UFs e Validações
1. Criar `src/core/athlete/brazilian-states.ts` contendo a lista padronizada de 27 UFs brasileiras, labels com nome por extenso e validador.
2. Atualizar os contratos em `src/schemas/player.ts` com validação de `state` (ou `uf`), `city` e `club`.
3. Escrever testes unitários em `src/core/athlete/__tests__/brazilian-states.test.ts`.

### Fase 2: Componente Reutilizável de Origem do Atleta
1. Criar `src/components/athlete/AthleteOriginSection.tsx` (respeitando R-03, $\le 100$ linhas):
   - Grid responsivo em 3 colunas: UF (select estilizado), Cidade (input de texto), Clube do Atleta (input de texto).
   - Suporte completo a tema claro e escuro (tokens `telemetry-*`).
2. Criar testes de componente em `src/components/athlete/__tests__/AthleteOriginSection.test.tsx`.

### Fase 3: Integração no Modal "Novo Atleta" (`/match/new` e `/atletas`)
1. Atualizar `src/app/atletas/types.ts` (`AthleteForm` e `EMPTY_ATHLETE_FORM`) incluindo `uf`, `city` e `club`.
2. Em `src/app/match/new/components/use-new-athlete-modal.ts` e `new-athlete-modal.logic.ts`:
   - Incorporar os campos de origem no payload enviado a `playersClient.create`.
   - Se o atleta for marcado como "Outro clube", garantir envio de `myClub: false` com os respectivos dados preenchidos.
3. Integrar `AthleteOriginSection` na aba ou seção de identificação do `NewAthleteModal`.

### Fase 4: Integração no Treinador Avulso (`/treinador`)
1. No fluxo de cadastro de atleta pelo Treinador Avulso (`src/app/atletas` ou modal em contexto particular):
   - Os campos de UF, Cidade e Clube vêm visíveis e opcionais por padrão.
   - O backend em `src/app/api/players/players-post.logic.ts` já trata `myClub: false` para treinadores avulsos e estabelece o `CoachAthleteLink` para acompanhamento técnico.

### Fase 5: Integração no Treinador de Clube (`/clube/treinador`)
1. No modal de criação de atleta pelo Treinador de Clube:
   - Adicionar o controle *"Atleta pertence ao meu clube?"*.
   - Se desmarcado: exibe os campos de UF, Cidade e Clube de origem, desativando o vínculo obrigatório com o CT do treinador.

### Fase 6: Integração no Gestor de Clube (`/gestor`)
1. Atualizar `src/app/gestor/cadastrar-membro-form.tsx` e `cadastrar-membro-modal.tsx`:
   - Quando o tipo for `ATLETA`, permitir selecionar entre *"Atleta do Clube (integrar ao elenco)"* e *"Atleta de Outro Clube (adversário / visitante)"*.
   - Se "Atleta de Outro Clube":
     - Oculta solicitação de provisionamento/link de senha de membro do clube.
     - Exibe os campos UF, Cidade e Clube.
     - A API `POST /api/gestor/athletes` salva o atleta no pool com `myClub: false` sem associar `PlayerCT`.

### Fase 7: Exibição da Origem em Placar, Cards e Relatórios
1. No cabeçalho da partida e cards de confronto:
   - Apresentar o clube e UF do atleta caso informados (ex.: *"Lucas Silva (Pinheiros - SP)"*).
2. Na listagem de `/atletas`:
   - Exibir coluna ou badge com o Clube / UF de origem.

---

## 5. Estratégia de Testes e Qualidade

- **Testes Unitários:**
  - Validação estrita das 27 UFs e rejeição de siglas inexistentes.
  - Testes do payload em `new-athlete-modal.logic.test.ts`.
- **Testes de Integração de API:**
  - `POST /api/players` com `myClub: false` e campos `uf`, `city`, `club` gravados com sucesso.
  - `POST /api/gestor/athletes` tratando criação de atleta externo sem gerar `PlayerCT`.
- **Guardrails de Qualidade Obrigatórios:**
  - R-03: Nenhum arquivo criado ou alterado pode exceder 100 linhas.
  - Design System: Proibição de cores genéricas (`bg-gray-*`, `text-gray-*`, etc.).
  - Execução de `node node_modules/typescript/bin/tsc --noEmit` (0 erros).
  - Execução de `node node_modules/next/dist/bin/next lint` (0 erros/avisos).
  - Suíte de regressão verde (`node scripts/run-tests.js`).

---

## 6. Riscos e Mitigações

1. **Risco:** Poluição da listagem oficial de atletas do Gestor com atletas de outros clubes.
   - *Mitigação:* A listagem principal de `/gestor` filtra estritamente `playerCts.ctId === currentCtId`. Atletas de fora nunca aparecerão como atletas do clube.
2. **Risco:** Duplicação de nomes de clubes com grafias ligeiramente diferentes (ex.: "Pinheiros" vs. "E.C. Pinheiros").
   - *Mitigação:* Campo livre com texto normalizado (`trim`), preparando para futura sugestão/autocomplete sem travar a digitação ágil do anotador.

