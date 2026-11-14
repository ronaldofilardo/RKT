# Plano: Usabilidade Outdoor e Cores Perceptuais (Color & Contrast)

**Data:** 03/11/2026  
**Status:** Planejamento Aprovado / Pronto para Execução  
**Documentos de Referência:** [docs/DESIGN.md](DESIGN.md) | [src/app/globals.css](../src/app/globals.css)

---

## 🎯 Objetivo Geral

Garantir legibilidade visual imediata em ambientes de alta incidência de luz solar direta (quadra aberta ao meio-dia, com reflexo e ofuscamento na tela do dispositivo) e em quadras cobertas/noturnas, eliminando a perda de contraste e assegurando conformidade estrita com o padrão **WCAG AAA (mínimo de 7:1)** nos números críticos de placar e parciais.

---

## 🏛️ Pilar 1: Calibragem OKLCH para Tema Claro (Outdoor Warm Court)

### 1.1 Diagnóstico do Problema Atual
* No tema claro atual:
  * `--telemetry-base`: `241 245 249` (`#F1F5F9` - Slate 100 frio/azulado).
  * `--telemetry-card`: `255 255 255` (`#FFFFFF`).
  * `--telemetry-elevated`: `248 250 252` (`#F8FAFC`).
* **Sintoma sob o sol:** A diferença de luminância entre `#F1F5F9` e `#FFFFFF` é de apenas **1.08:1**. Sob luz solar intensa, o olho humano percebe tudo como uma mancha branca única e lavada (*glare washout*), perdendo a percepção de profundidade dos cards e agrupamentos visuais.

### 1.2 Proposta com Espaço Perceptual OKLCH
Usar o modelo **OKLCH** (Luminância Perceptual Uniforme, Croma e Matiz) para calibrar a base com inspiração em piso sintético claro / cinza-quadra aquecido (*warm court stone*):
* **Luminância uniforme:** Evita a sensação de cinza "sujo" ou "azulado hospitalar".
* **Base aquecida (*warm ground*):**
  * `L: 94%`, `C: 0.010`, `H: 80` $\rightarrow$ RGB canais: `242 239 233` (`#F2EFE9`).
* **Card Surface (Nível 1):**
  * `L: 99%`, `C: 0.002`, `H: 80` $\rightarrow$ RGB canais: `255 255 255` (`#FFFFFF`), com borda sutil de demarcação (`#E2DDD3` / `L: 88%`).
* **Elevated Surface (Nível 2 - Células do Placar e Inputs):**
  * Em vez de quase branco, usar um recuo contrastante para leitura: `L: 91%`, `C: 0.012`, `H: 80` $\rightarrow$ RGB canais: `235 231 223` (`#EBE7DF`).
* **Resultado:** O contraste entre card e elevated sobe de **1.03:1 para 1.25:1**, criando contornos nítidos mesmo com o brilho da tela atenuado pela luz do dia.

---

## 🔢 Pilar 2: Contraste no Placar (WCAG AAA - 7:1)

### 2.1 Diagnóstico das Células de Pontuação
Atualmente, as células de sets em `match-card-score-grid.tsx` e `scoreboard-card-cells.tsx` aplicam:
* Dígitos do game ativo: `text-telemetry-volt` ou `text-white` / `text-slate-900`.
* Dígitos de sets passados / parciais: utilizam classes como `text-telemetry-text-muted` (`#64748B` no claro e `#94A3B8` no escuro) ou opacidades reduzidas (`text-white/60`).
  * Contraste de `#64748B` contra fundo claro: **4.6:1** (passa em AA, mas **FALHA no AAA** de 7:1).
  * Em quadra, um placar de `6-4` ou `10-8` num tiebreak fica ilegível se o árbitro/treinador estiver a 1 metro da tela sob sol.

### 2.2 Estratégia de Adequação WCAG AAA (7:1)
1. **Dígito Ativo / Vencedor de Set:**
   * **Modo Escuro (Fundo `#111827`):**
     * Dígito principal: `#FFFFFF` (contraste de **15.8:1** - AAA).
     * Destaque / Game atual: `--telemetry-volt` calibrado para `oklch(88% 0.22 135)` (`#CCFF00`), contraste de **13.5:1** (AAA).
   * **Modo Claro (Fundo `#FFFFFF` ou `#EBE7DF`):**
     * Dígito principal: `oklch(22% 0.02 260)` (`#0F172A` - Navy Black profundo), contraste de **14.2:1** contra `#EBE7DF` e **16.3:1** contra branco (AAA absoluto).
2. **Dígito Passivo / Sets Anteriores:**
   * Criar o token semântico dedicado `--telemetry-score-past`:
     * Modo Escuro: `#CBD5E1` (Slate 300) $\rightarrow$ contraste **9.2:1** (AAA).
     * Modo Claro: `#334155` (Slate 700) $\rightarrow$ contraste **9.4:1** (AAA).
   * Eliminar o uso de `opacity` (`/60` ou `/40`) em números de placar; a redução de ênfase hierárquica será obtida estritamente por peso tipográfico (`font-semibold` vs `font-bold`) e matiz perceptivo, nunca rebaixando a luminância abaixo de 7:1.
3. **Métrica Numérica Tabular:**
   * Garantir `font-variant-numeric: tabular-nums` e `font-mono` / `Space Grotesk` nos slots numéricos para evitar trepidação visual durante o rally.

---

## 🎾 Pilar 3: Superfícies Temáticas (Clay & Hard Court Accents)

Tokens já existentes no sistema:
* `--telemetry-court-clay`: `196 98 58` (`#C4623A` - Terracota Saibro)
* `--telemetry-court-hard`: `30 77 123` (`#1E4D7B` - Azul Quadra Rápida)
* `--telemetry-court-grass`: `46 125 50` (`#2E7D32` - Verde Grama)

### 3.1 Aplicações Sutis e Contextuais (Micro-Toques)
Para não poluir o layout com blocos pesados de cor:
1. **Identificador de Borda do Card (Court Border Accent):**
   * Uma linha superior ou lateral esquerda de **2.5px** no card da partida (`MatchCard.tsx`) que assume a cor da superfície:
     * Exemplo: `border-l-[3px] border-[rgb(var(--telemetry-court-clay))]` para saibro.
2. **Pill de Superfície com Alta Legibilidade:**
   * Badge do tipo de piso com acabamento tátil:
     * No tema claro: fundo com 12% de opacidade da cor do piso e texto com a cor do piso escurecida (Luminância 35%) para atingir 4.5:1.
     * No tema escuro: fundo com 20% de opacidade e texto na cor pura do token com brilho sutil.
3. **Micro-Gradiente no Header de Placar ao Vivo:**
   * Na tela de anotação/placar (`scoring-page-chrome.tsx` / `CourtBackground.tsx`):
     * Um gradiente linear sutil no topo (altura 48px, opacidade 6% $\rightarrow$ 0%) injetando o matiz da quadra (`clay`, `hard` ou `grass`), conferindo identidade esportiva sem comprometer o contraste dos controles.

---

## 🛠️ Etapas de Execução Recomendadas

| Fase | Ação | Arquivos Impactados |
| :--- | :--- | :--- |
| **Fase 1** | **Calibração de Tokens CSS**<br>Adicionar novas variáveis de superfície clara aquecida e tokens de placar (`--telemetry-score-main`, `--telemetry-score-secondary`). | `src/app/globals.css` |
| **Fase 2** | **Refatoração dos Dígitos de Placar**<br>Substituir classes de opacidade nos números de games/sets pelos tokens com contraste AAA garantido. | `src/components/dashboard/match-card-score-grid.tsx`<br>`src/components/dashboard/scoreboard-card-cells.tsx`<br>`src/components/scoring/scoring-page-play-area.tsx` |
| **Fase 3** | **Micro-Toques de Piso**<br>Aplicar indicador de borda no `MatchCard` e badges sutis baseados no enum `courtType` (CLAY, HARD, GRASS). | `src/components/dashboard/MatchCard.tsx`<br>`src/components/dashboard/use-match-card-data.ts` |
| **Fase 4** | **Validação Automatizada de Contraste**<br>Criar teste unitário em Jest calculando o contraste relativo (fórmula WCAG) dos novos pares de cores para garantir que nenhuma combinação fique abaixo de 7:1. | `src/test/contrast-wcag.spec.ts` |

