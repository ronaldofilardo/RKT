# Resumo das Mudanças - Let e Estatísticas de Bolas

## Data: 2026-07-07

## Contexto
Melhorias no fluxo de saque e estatísticas de bolas na timeline:
1. Remoção do botão Let do ActionBar
2. Adição do botão Let no modal de Efeito do Saque (quando `includeLet = true`)
3. Correção das estatísticas de bolas na timeline

## Mudanças Realizadas

### 1. ServerEffectModal (`src/components/scoring/ServerEffectModal.tsx`)
**Adições:**
- Nova prop `onLet?: () => void` - handler para ação de Let
- Nova prop `showLetOption?: boolean` - controla exibição do botão Let
- Função `handleLetClick` - chama onLet quando disponível
- Botão "Let" no footer (condicional)
  - Exibido apenas quando: `context === 'winner'` E `showLetOption === true` E `onLet` definido
  - Estilo: âmbar com ícone de aviso ⚠️
  - Texto: "Let (Repetir Saque)"

### 2. ActionBar (`src/components/scoring/ActionBar.tsx`)
**Remoções:**
- Prop `onLet` da interface `ActionBarProps`
- Botão "Let" da grid de ações
- Grid alterada de 4 para 3 colunas (Ace, Out, Net)

### 3. Scoring Page (`src/app/match/[id]/scoring/page.tsx`)
**Alterações:**
- Removida prop `onLet` do componente ActionBar
- Adicionadas props `onLet` e `showLetOption` ao ServerEffectModal
- `showLetOption` calculado como: `modalParams.context === "winner" && match.includeLet === true`

### 4. useScoringHandlers (`src/hooks/useScoringHandlers.ts`)
**Adições:**
- Campo `includeLet?: boolean` na interface `MatchData`

### 5. Estatísticas de Bolas na Timeline
**Valores de previewBalls:**
- **Ace**: `previewBalls: 1` (apenas o saque)
- **Dupla Falta**: `rallyLength: 1`, `previewBalls: 1` (apenas o 2º saque)
- **Devolução**: `previewBalls: 2` (saque + devolução)
- **Rally longo**: `previewBalls: n` (número de bolas no ponto)

**Arquivos com a lógica:**
- `src/hooks/useScoringHandlers.ts` - handleServerEffectConfirm: ACE com `rallyLength: 1`
- `src/components/scoring/PointDetailsModal.tsx` - `previewBalls: isDevolucao ? 2 : 1`

### 6. CSS - Legibilidade de Inputs (`src/app/globals.css`)
**Adições:**
- Regras CSS para garantir contraste em inputs e selects
- `background-color: #ffffff` para todos os inputs
- `color: #181d26` para texto dos inputs
- `color: #6b7280` para placeholders

## Regra de Negócio - includeLet

O campo `includeLet` é:
- `true` apenas para categoria **JUVENIL**
- `null` para demais categorias (INFANTIL, ADULTO, VETERANO)

**Fluxo:**
1. Nova Partida → Categoria JUVENIL → `includeLet = true`
2. Scoring → Ace no saque → Modal Efeito do Saque → Botão Let visível
3. Clicar em Let → Chama `handleLet()` → Repete o ponto atual

## Testes Criados

### 1. `src/hooks/__tests__/let-ace-changes.test.ts` (8 testes)
- Visibilidade do botão Let
- Estatísticas de bolas (Ace, Dupla Falta, Devolução)
- Remoção do Let do ActionBar
- Campo includeLet no MatchData

### 2. `src/components/scoring/__tests__/let-ace-modals.test.ts` (18 testes)
- Props do ServerEffectModal
- Lógica de exibição do botão Let
- ACE com efeitos e direção
- previewBalls do PointDetailsModal
- Integração com categorias

**Total: 26 testes passando ✅**

## Compatibilidade

- ✅ Todos os testes existentes do useScoringHandlers passam (9 testes)
- ✅ Total de 513 testes passando no projeto
- ✅ Sem breaking changes na API
- ✅ Campo `includeLet` já existia no schema do Prisma e matchService

## Próximos Passos (Sugestões)

1. **Teste E2E**: Criar teste de fluxo completo no Playwright
   - Criar partida JUVENIL com includeLet
   - Fazer Ace no saque
   - Verificar botão Let no modal
   - Clicar em Let e verificar repetição do ponto

2. **UI/UX**: Considerar tooltip explicando o Let para usuários iniciantes

3. **Analytics**: Rastrear uso do Let para entender frequência em partidas JUVENIL

## Arquivos Modificados

1. `src/components/scoring/ServerEffectModal.tsx`
2. `src/components/scoring/ActionBar.tsx`
3. `src/app/match/[id]/scoring/page.tsx`
4. `src/hooks/useScoringHandlers.ts`
5. `src/app/globals.css`

## Arquivos Criados

1. `src/hooks/__tests__/let-ace-changes.test.ts`
2. `src/components/scoring/__tests__/let-ace-modals.test.ts`