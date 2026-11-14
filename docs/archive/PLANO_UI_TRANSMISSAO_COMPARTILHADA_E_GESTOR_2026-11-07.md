# Plano de Execução — UI da Transmissão Compartilhada e do Gestor

> **Data:** 2026-11-07  
> **Status:** Planejamento (sem implementação)  
> **Escopo:** Ajustes exclusivamente visuais na transmissão acessada por link compartilhado e pela aba Partidas do `/gestor`.  
> **Referência visual:** simulador de partida da landing page em `C:\apps\RKT-LP`.  
> **Diretrizes:** `docs/DESIGN.md`, `docs/RULES.md` e `.agent-os/standards/`.

## 1. Objetivo

Melhorar a clareza e a hierarquia visual da tela de transmissão, aproximando sua composição da referência da landing page: identificação e status da partida, placar, último ponto e histórico/timeline.

A referência da landing page é apenas visual. Na aplicação RKT, a transmissão continua exibindo os dados reais da partida persistidos e recebidos pelo feed. Não reproduzir o loop, os tempos, placares ou eventos demonstrativos da landing.

## 2. Escopo e restrições

### Incluído

- Layout, espaçamento, agrupamento, tipografia, cores e ênfases visuais.
- Adaptação responsiva para celular, desktop e janela flutuante do Gestor.
- Verificação visual dos estados reais já existentes.

### Fora de escopo

- Alterar, omitir, reordenar semanticamente ou inventar informações da partida.
- Alterar payloads, persistência, feed, polling, atualizações, autorização ou regras.
- Modificar o fluxo de resgate do convite, sua prévia ou mensagens funcionais.
- Introduzir dados, eventos, estados ou comportamento da simulação da landing.
- Alterar o destino de partidas finalizadas, que permanece no relatório.

## 3. Pontos de entrada e superfícies

1. **Link compartilhado:** convite em `src/app/matches/convite/[token]/`; após validação e resgate, acompanhamento em `src/app/matches/acompanhar/[matchId]/`.
2. **Gestor → Partidas → Ver Partida:** `src/app/gestor/club-matches-table.tsx`; partidas em andamento/agendadas abrem a janela de acompanhamento quando o provider está disponível, com fallback para a rota de acompanhamento.
3. **Conteúdo reutilizado:** `SpectatorLiveContent` é compartilhado entre a página e a janela flutuante. A melhoria visual deve ser aplicada de modo consistente às duas superfícies.

## 4. Plano por etapas

### Etapa 1 — Registrar baseline e proteger contratos

- Revisar a tela atual e capturas em larguras de celular e desktop, tanto na rota compartilhada quanto na janela do Gestor.
- Identificar os dados já apresentados em cada estado; não tratar a fixture da landing como dado do app.
- Confirmar os testes existentes de navegação do Gestor e os testes do feed/timeline.
- Usar testes de caracterização quando a alteração tocar comportamento legado; limitar as mudanças aos estilos e à composição.

### Etapa 2 — Hierarquia da transmissão

- Reorganizar visualmente cabeçalho, status/atualização, placar, último ponto e abas.
- Dar prioridade perceptível ao confronto e ao placar real sem alterar seus componentes de dados ou cálculo.
- Distinguir o resumo visual do último ponto de sua ocorrência correspondente no histórico, mantendo ambos.
- Evitar que indicadores secundários concorram com a leitura do placar.

### Etapa 3 — Timeline e detalhes

- Melhorar alinhamento e ritmo das linhas, placares de game/ponto e chips de anotação.
- Aplicar a identidade visual dos lados de forma consistente, garantindo que texto, vencedor e detalhes continuem legíveis.
- Preservar todos os eventos já fornecidos pelo feed, sua ordem, marcadores de correção, legenda e detalhes.
- Não impor limite de eventos, loop, temporização ou animação que sugira dados simulados.

### Etapa 4 — Estados e cores

- Harmonizar os estilos existentes para ao vivo, aguardando início, sem sinal, pausado, offline, encerrado e placar ajustado.
- Manter a semântica atual e garantir que status não sejam comunicados apenas por cor.
- Preservar avisos, dados recebidos anteriormente e controles de retomada/atualização já existentes.
- Aplicar as cores Telemetry já adotadas no produto, respeitando o tema e o contraste.

### Etapa 5 — Responsividade nas duas superfícies

- Na rota compartilhada, aproveitar melhor a largura em telas grandes e preservar conforto de leitura em celular.
- Na janela do Gestor, adaptar a mesma composição ao popup desktop e ao bottom-sheet mobile, sem sobrepor controles nem reduzir a área útil da timeline.
- Verificar placar sticky, rolagem, abas, zoom e áreas seguras do dispositivo.

### Etapa 6 — Validação e fechamento

- Comparar as capturas antes/depois nas duas entradas e em celular/desktop.
- Validar que o placar/timeline vêm do feed e permanecem idênticos em conteúdo antes e depois.
- Rodar testes direcionados da tela, do feed/timeline e de `club-matches-table`; executar typecheck, lint e guardrail R-03 conforme necessário.
- Verificar acessibilidade: foco visível, contraste, estados anunciados e alvos interativos adequados.
- Atualizar `docs/MEMORY.md` após implementação, registrando explicitamente que a mudança foi visual.

## 5. Matriz de regressão visual

| Cenário | Superfície |
|---|---|
| Convite válido após resgate | Rota compartilhada |
| Partida agendada / sem pontos | Rota e janela do Gestor |
| Partida ao vivo com pontos e detalhes | Rota e janela do Gestor |
| Duplas e nomes longos | Rota e janela do Gestor |
| Sem sinal, offline e anotação pausada | Rota e janela do Gestor |
| Correção manual de placar | Rota e janela do Gestor |
| Partida encerrada | Rota; no Gestor, preservar destino atual para o relatório |
| Convite inválido/revogado e carregamento | Preservar telas atuais, sem redesenhar o fluxo funcional |

## 6. Critérios de aceite

- As duas entradas mostram uma apresentação visual coerente da transmissão.
- Nenhum campo, evento, anotação, aviso, marcador ou controle existente é removido.
- Valores, ordem e atualização do placar e da timeline continuam vinculados à partida/feed real.
- Nenhum dado ou comportamento demonstrativo da landing é introduzido no sistema.
- A janela flutuante e a rota continuam utilizáveis em celular e desktop.
- Estados de rede, correção, acesso e encerramento mantêm o significado atual.
- Testes direcionados, typecheck, lint e guardrail aplicável passam.

## 7. Arquivos de referência para implementação

- `src/app/matches/acompanhar/[matchId]/page.tsx`
- `src/app/matches/acompanhar/[matchId]/SpectatorLiveContent.tsx`
- `src/app/matches/acompanhar/[matchId]/SpectatorHeader.tsx`
- `src/app/matches/acompanhar/[matchId]/SpectatorScoreboard.tsx`
- `src/app/matches/acompanhar/[matchId]/SpectatorLastPointBanner.tsx`
- `src/app/matches/acompanhar/[matchId]/SpectatorTimeline.tsx`
- `src/app/matches/acompanhar/[matchId]/SpectatorTabs.tsx`
- `src/components/spectate/SpectatorStatusBanner.tsx`
- `src/components/spectate/FloatingSpectatorPanel.tsx`
- `src/app/gestor/club-matches-table.tsx`
- `src/app/gestor/__tests__/club-matches-table.test.tsx`
- Referência visual apenas: `C:\apps\RKT-LP\src\components\telemetry-demo\MatchReplay.tsx`
