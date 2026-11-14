# Plano de Implementação: Duplas Just-in-Time, Ponto Decisivo No-Ad e Edição de Sacador

**Data:** 04/11/2026  
**Status:** Planejado / Pronto para Execução  
**Documentos de Referência:** [docs/RULES.md](RULES.md) | [docs/DESIGN.md](DESIGN.md) | [docs/ARCHITECTURE.md](ARCHITECTURE.md) | [docs/MEMORY.md](MEMORY.md)

---

## 🎯 Contexto e Motivação

Durante testes com usuários reais (anotadores e treinadores em quadra), foram identificadas duas fricções operacionais graves na experiência de anotação de partidas:

1. **Início de Partida de Duplas Rígido e Irreal:**
   * O sistema atualmente exige, antes do 1º ponto, que se definam os sacadores de **ambas** as duplas e os lados de devolução de todos os jogadores.
   * Na realidade do tênis (Regra 14 da ITF), a dupla que começa recebendo **ainda não decidiu quem sacará no game 2**. Exigir essa escolha antes da partida começar força o anotador a adivinhar ou interromper o aquecimento dos atletas.
   * Além disso, em jogos com formato **No-Ad (sem vantagem)**, ao empatar em 40-40 (ponto decisivo), a dupla recebedora tem o direito de escolher quem vai receber o saque, o que hoje não possui interface ágil de 1 toque.

2. **Impossibilidade de Corrigir o Sacador (Falta de Tolerância a Erros):**
   * Se o anotador errar o sacador na inicialização, se confundir na rotação ou se os atletas trocarem de sacador sem aviso, **não existe forma rápida de mudar o sacador**.
   * O usuário é obrigado a cancelar a partida e refazer todo o fluxo de criação desde o início, gerando grande atrito e perda de tempo na quadra.

---

## 🏛️ Pilar 1: Definição *"Just-in-Time"* em Duplas (Regra 14 ITF)

### 1.1 Simplificação do Modal Inicial de Duplas (`DoublesServerSelectionModal`)
* **O que muda no início do 1º set:**
  1. **Quem começa sacando:** Seleção da Dupla Sacadora (Dupla 1 vs Dupla 2).
  2. **1º Sacador:** Seleção exclusiva de quem saca pela Dupla Sacadora (ex.: Jogador A1).
  3. **Posição dos Recebedores:** Seleção de quem recebe na Igualdade (Deuce court) e na Vantagem (Ad court) da Dupla Recebedora.
* **O que é removido da largada:** A pergunta sobre quem será o 1º sacador da dupla recebedora é **completamente eliminada** do modal pré-jogo.

### 1.2 Micro-prompt no Início do Game 2 (Transição de Game)
* **Gatilho:** Ao finalizar o game 1 (placar 1-0 ou 0-1), o motor detecta que a Dupla B vai sacar pela primeira vez no set e que seu primeiro sacador ainda não foi registrado (`p2FirstServer === null`).
* **Interface (Micro-card / Bottom Sheet de 1 toque):**
  * Uma janela modal mínima e não invasiva surge sobre a área de anotação:
    > **"Game 2 — Quem vai sacar pela [Nome da Dupla]?"**  
    > `[ Jogador B1 ]` &nbsp;&nbsp;&nbsp;&nbsp; `[ Jogador B2 ]`
  * O anotador dá **1 toque** no atleta posicionado para o serviço.
* **Travamento da Rotação:**
  * Com B1 definido, o ciclo de saque de duplas fica matematicamente resolvido para todo o restante do set:
    * Game 1: A1 (Dupla A)
    * Game 2: B1 (Dupla B)
    * Game 3: A2 (Dupla A - parceiro de A1)
    * Game 4: B2 (Dupla B - parceiro de B1)
    * Game 5 em diante: repete o ciclo (A1 -> B1 -> A2 -> B2).

---

## ⚡ Pilar 2: Recebedor no Ponto Decisivo (No-Ad Deuce / 40-40)

### 2.1 Detecção Automática
* Em partidas configuradas com formatos sem vantagem (`SHORT_SET_2V2_NO_AD`, `BEST_OF_3_NO_AD` ou qualquer variação "no ad"), quando o game atingir `40-40` (`isDeuce: true`), o sistema reconhece o ponto decisivo (*Deciding Point*).

### 2.2 Seleção Rápida de Recebedor
* **Em Duplas:**
  * Destacar visualmente no card da dupla recebedora os dois parceiros:
    > *"Ponto Decisivo — Escolha quem recebe:"*  
    > `[ Jogador 1 (Lado Direito / Igualdade) ]` &nbsp;&nbsp;|&nbsp;&nbsp; `[ Jogador 2 (Lado Esquerdo / Vantagem) ]`
  * Pré-selecionar o lado tradicional de devolução, permitindo que com 1 toque rápido o anotador alterne se a dupla adversária escolher inverter o recebedor do ponto decisivo.
* **Em Simples:**
  * O sacador saca no lado escolhido pelo recebedor (Igualdade ou Vantagem).

---

## 🔄 Pilar 3: Edição / Troca Ágil de Sacador em Qualquer Momento

### 3.1 Ação Rápida: Toque no Ícone da Bolinha (`🎾`) no `PlayerCard`
* **Localização:** No cabeçalho de quem está sacando em `PlayerCard.tsx`.
* **Comportamento Interativo:**
  * O ícone `🎾` passa a ter `role="button"` e cursor clicável com tooltip sutil *"Trocar sacador"*.
  * **Em Simples:**
    * Ao tocar no `🎾`, exibe micro-confirmação:  
      *"Inverter sacador deste game para [Nome do Adversário]?"*  
      `[ Cancelar ]` &nbsp;&nbsp; `[ Confirmar ]`
  * **Em Duplas:**
    * Ao tocar no `🎾`, abre diálogo com os 4 atletas dispostos em 2 colunas:
      > **Dupla 1:** `[ Atleta 1A (Atual) ]` &nbsp; `[ Atleta 1B ]`  
      > **Dupla 2:** `[ Atleta 2A ]` &nbsp; `[ Atleta 2B ]`  
    * 1 toque altera imediatamente quem é o sacador ativo do game.

### 3.2 Seletor Explicito no Modal "Editar Placar" (`EditScoreModal`)
* No modal de edição de placar (acessível pelo menu superior de 3 pontos):
  * Adicionar uma seção visível e dedicada: **"Sacador do game atual"**.
  * Em duplas, listar os 4 atletas com botões de rádio ou pílulas (`pill buttons`), permitindo retificar o sacador ativo tanto da dupla quanto individualmente.

### 3.3 Recuperação Inteligente pós-Undo (Desfazer)
* Se o anotador marcou o 1º ponto de um game e percebeu o erro de sacador:
  * Ao dar *Swipe Down* (Desfazer), quando o placar do game retorna a `0-0`, a interface exibe um botão temporário sutil na base do placar: *"Corrigir Sacador"*, facilitando a retificação sem precisar abrir menus.

---

## 🗺️ Mapa de Arquivos Afetados

```
src/
├── app/
│   └── match/
│       ├── [id]/scoring/
│       │   ├── scoring-play-area-players.tsx       # Toque interativo no ícone de saque
│       │   ├── scoring-point-modals.tsx            # Inclusão do modal/prompt Game 2 duplas e No-Ad
│       │   ├── scoring-edit-score-modal.tsx        # Seletor de sacador em duplas no Editar Placar
│       │   └── useScoringPageHandlers.ts           # Handler para troca manual de sacador
│       └── new/components/
│           ├── DoublesServerSelectionModal.tsx     # Remoção da exigência do 2º sacador no setup
│           ├── doubles-serve-order-section.tsx     # Desativação do campo do 2º sacador na largada
│           └── use-doubles-server-selection.ts     # Payload flexível com firstServerP2 opcional
├── components/
│   └── scoring/
│       ├── PlayerCard.tsx                          # Botão/gatilho acessível na bolinha 🎾
│       ├── EditScoreModal.tsx                      # Exibição do seletor de 4 atletas em duplas
│       └── edit-score-modal-content.tsx            # Layout dos controles de sacador
├── core/scoring/
│   ├── engine-types.ts                             # DoublesSetup com secondTeamFirstServerId nullable
│   ├── doubles-server-rotation.logic.ts            # Lógica pura de cálculo e registro de rotação A1/B1/A2/B2
│   └── TennisScoringEngine.ts                      # Suporte à definição de B1 no início do Game 2
└── hooks/
    ├── useSessionManager.ts                        # Ação de updateServerState sem reset de partida
    └── useEditScoreModal.ts                        # Estado e persistência de troca de sacador
```

---

## 📋 Fases de Execução e Plano de Testes

### Fase 1: Troca Manual de Sacador Durante a Partida (Tolerância a Erro)
1. **Frontend:** Adicionar evento de clique no ícone `🎾` do `PlayerCard.tsx` com popover de confirmação para Simples e seleção de jogador para Duplas.
2. **Modal Editar Placar:** Adicionar seletor visual de sacador em `EditScoreModal.tsx` com suporte a Simples e Duplas.
3. **Core:** Expor método `setGameServer(serverId)` no `TennisScoringEngine` para atualizar o sacador ativo do game sem reiniciar o placar nem perder o histórico.
4. **Testes:**
   * Teste unitário de troca de sacador em Simples durante game em andamento.
   * Teste unitário de troca de sacador em Duplas (troca de parceiro ou troca de dupla).

### Fase 2: Duplas Just-in-Time (Início da Partida + Game 2)
1. **Modal de Setup (`DoublesServerSelectionModal`):** Remover a seção de escolha do sacador da dupla recebedora. Apenas a dupla sacadora escolhe seu sacador do game 1.
2. **Detecção do Game 2:** Implementar interceptor no `TennisScoringEngine` ao transitar de Game 1 para Game 2 que dispara o micro-modal *"Quem saca pela Dupla B?"*.
3. **Persistência da Rotação:** Ao registrar o sacador da Dupla B, travar a rotação completa do set.
4. **Testes:**
   * Teste de inicialização de duplas sem informar o 2º sacador.
   * Teste de disparo do micro-prompt no game 2 e consolidação da rotação (games 1 a 6).

### Fase 3: Ponto Decisivo no No-Ad (40-40)
1. **Detecção e UI:** Em partidas No-Ad ao atingir 40-40, exibir mini-card destacando a escolha de lado/recebedor da dupla que devolve.
2. **Registro na Timeline:** Registrar no `rallyDetails` o recebedor escolhido para estatísticas de devolução.
3. **Testes:**
   * Teste em partida No-Ad atingindo 40-40 e validando a seleção de recebedor.

---

## 🛡️ Critérios de Aceite (Definition of Done)
- [ ] Usuário consegue iniciar uma partida de duplas definindo apenas quem saca no Game 1.
- [ ] No início do Game 2, o sistema apresenta seleção com 1 toque para definir o sacador da outra dupla.
- [ ] Em qualquer momento da partida (Simples ou Duplas), o anotador pode tocar na bolinha `🎾` e corrigir o sacador do game sem perder pontos já marcados.
- [ ] No modal "Editar Placar", o sacador do game em andamento pode ser retificado explicitamente.
- [ ] Em empates de 40-40 no formato No-Ad, o recebedor do ponto decisivo pode ser indicado com 1 toque.
- [ ] 100% de aprovação na suíte de testes (`pnpm test`) e TypeScript estrito (`tsc --noEmit`).

