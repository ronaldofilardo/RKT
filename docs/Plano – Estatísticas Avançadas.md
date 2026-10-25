Plano – Estatísticas Avançadas bkpRKT (atualização 24/out/26)
24 de out. de 2026 · @Ron Filla
Objetivo e decisões
A aba Estatísticas Avançadas (/report) passa a seguir a planilha de 24/out/26 em quatro fases, sem nenhum campo novo no modal de anotação. Nada foi alterado no código; este documento é só o plano.
Tema
Decisão
Escopo por set
Só a tabela de breakdown por set; sem filtro Geral/Set em todas as seções
Numeração
As seções repetidas da planilha viram 8 (Estatísticas dos golpes) e 9 (Momentum)
Devolução em quadra
1 − (aces sofridos + erros do devolvedor na devolução) ÷ pontos devolvidos, por 1º e 2º saque
Linha "Aproachs"
Números de subida à rede (W, EF, ENF dos pontos de Rede); o golpe de aproximação não é gravado
Tempo total
Relógio completo, com pausas e trocas de lado
Tempo efetivo
Intervalos entre registros, descartando os maiores que 90 s (constante ajustável)
Cabeçalho
Bloco repetido no topo da aba, com duração total; o cabeçalho fixo da página continua
O horário de cada ponto é o do clique do anotador (gravado pelo servidor só com correção de futuro e de antes do início), então pontos anotados offline mantêm o horário real.
Fase 1 – Correções do que já existe
Quinze itens calculam errado hoje e vêm antes de qualquer seção nova, porque as seções novas dependem de alguns deles (rally e situação do ponto).
#
Correção
Onde
Como
1.1
Duração do rally ignora a faixa escolhida (1-4, 5-8, +9)
hooks/point-processor.details.logic.ts, core/report/pressure-shot-stats.ts
Converter duracao em número de trocas (ou em faixa) ao gravar e ao ler; nos pontos antigos, usar duracao quando rallyLength for 1 ou 2 por padrão; calcular a distribuição uma vez por partida, não por jogador
1.2
Ace entra em Winners e dupla falta entra em ENF
core/report/pressure-shot-details.logic.ts
Excluir type ACE e DOUBLE_FAULT (e tipo dupla_falta) da classificação de lances; testes com dados reais (ace e DF com rallyDetails)
1.3
Game points: total conta os dois jogadores; deuce conta para ambos; vantagem não conta; tiebreak fixo em 9
core/scoring/point-ball-context.logic.ts, core/report/pressure-break-stats.logic.ts
Criar o conceito "game point de quem?" (jogador que vence o game se ganhar o ponto), incluindo vantagem e Ponto Decisivo; tiebreak pelo alvo do formato (7 ou 10) com diferença mínima
1.4
Set points: todo ponto de um game com placar 5-x conta
mesmo arquivo
Set point = game point do jogador que, vencendo o game, fecha o set; regra pelo formato (set de 6, pro set 8, set curto)
1.5
Subidas à rede contam pontos de Rede dos dois jogadores
core/report/pressure-shot-stats.ts
Subidas = Rede ganhas + Passada perdidas pelo jogador; passadas = Passada ganhas + Rede perdidas (Fase 2 cobre a tela)
1.6
Breakdown por set: coluna do J2 repete o placar do J1; sem placar de tiebreak
advanced-stats-set-breakdown.tsx
Mostrar p2Games na coluna do J2 e o placar do tiebreak (campos tiebreakP1/P2 existem no tipo, mas nunca são preenchidos; passam a ser calculados no breakdown)
1.7
Momentum: rótulo "(J2)" vem do campo longestLosingStreak; lista só com J1/J2 e só 5 itens
momentum-stats.ts, advanced-stats-momentum.tsx
Renomear o campo (maior sequência do J2), mostrar nomes dos jogadores, listar todas as sequências de 3+
1.8
Card "Sets registrados" da aba Resumo conta o set pelo número de pontos, não de games
report-view-stats.tsx, report-summary.logic.ts
Definir o vencedor de cada set pelo placar de games (e tiebreak); teste com set ganho com menos pontos
1.9
Piso Grama aparece como "Saibro" no cabeçalho
report-view-header.tsx
Mapear GRASS para "Grama"; teste de rótulo por piso
1.10
Quatro definições de "erro" (Resumo, breakdown, resumo do set, lances): ace e dupla falta entram ou saem conforme a tela
report-summary.logic.ts, set-breakdown-stats.ts, game-error-classify.logic.ts, pressure-shot-details.logic.ts
Regra única: ace e dupla falta fora de Winners e ENF em todas as telas; dupla falta só como erro do sacador nos totais de erros; uma função compartilhada
1.11
Último game incompleto conta como game fechado (partida em andamento ou abandonada)
serve-return-completed-games.ts
Fechar o game do último ponto só se o ponto encerra o game ou o set; teste com partida interrompida no meio do game
1.12
Exportar CSV: ponto_para mostra o sacador; 2s_efeito e 2s_direcao trazem o efeito do rally; erro traz o subtipo; rally traz a faixa; efeito e direcao repetidos
report-export.ts
Alinhar cada coluna ao cabeçalho (vencedor, efeito e direção do 2º saque, trocas), com teste de colunas
1.13
Resumo do set repete o cálculo de saque do relatório, com arredondamento e nomes diferentes (secondServesIn conta pontos de 2º saque)
set-summary-service.logic.ts, serve-stats.ts
Reaproveitar as funções do relatório e arredondar só na tela; renomear os campos
1.14
Cabeçalho das colunas desalinha dos valores (120 px fixos contra auto); clubName vai no payload e não está em ReportData
advanced-stats-primitives.tsx, report.types.ts
Usar a mesma coluna central nas duas linhas; acrescentar clubName ao tipo
1.15
Formato sem vantagem (padrão das duplas): o Ponto Decisivo (40-40) não conta como break point nem como game point do sacador; hoje só aparece como game point por acaso, via gameIsDeuce
point-ball-context.logic.ts, pressure-break-stats.logic.ts
No Ponto Decisivo, game point para os dois e break point para o devolvedor; testes para BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD
Efeito colateral conhecido: os números de partidas já finalizadas mudam depois da Fase 1 (pressure e rally), porque o relatório recalcula tudo a partir dos pontos gravados. Nenhuma migração de banco é necessária.
Fase 2 – Seções e métricas novas
Todas usam dados que já são gravados. Os cálculos ficam em src/core/report/ (um arquivo por seção, como hoje) e as telas em src/components/report/, na ordem e numeração da planilha.
Seção
O que entra
Fonte dos dados
2. Devolução
Total de pontos com devolução; % pontos ganhos devolvendo; % devolução em quadra no 1º e no 2º saque; rótulos da planilha (Total Break points, Break points Won, % Saques quebrados)
ReturnStats (já tem o total), situação "devolução" + tipo ENF/EF + ACE
3. Fundo de quadra
Pontos finalizados com os dois no fundo (situação "fundo") por W, ENF, EF; % de sucesso; % de sucesso por faixa de rally
rallyDetails.situacao, tipo, faixa de rally corrigida na 1.1
4. Rally
Curtos, Médios, Longos e duração média, uma vez por partida
Fase 1.1
5. Rede/Passada
Total de subidas, % de sucesso, total de passadas, % de sucesso, por jogador
Fase 1.5
6. Pontos de pressão
Game Points, Set Points, Tiebreaks, Total de pontos ganhos, com rótulos da planilha
Fase 1.3 e 1.4
7. Definição do ponto
Winners, EF e ENF por jogador, sem ace nem dupla falta
Fase 1.2
8. Estatísticas dos golpes
Tabela com EF, ENF, Winner e total por golpe: Sq, FH, BH, VFH, VBH, SVFH, SVBH, Sm, Drop, Lob, Bate Pronto, Aproachs
Golpe + golpe especial; SVFH/SVBH = swing volley + VFH/VBH; "Sq" = saque (ace como W, dupla falta como ENF, só nesta tabela, conforme decidido); "Aproachs" = pontos de Rede (W, EF, ENF)
9. Momentum
Sequência máxima, total de sequências de 2 pontos, lista completa de 3+ no formato "15x J2" (com o nome do jogador)
momentum-stats.ts
Pontos de atenção:
• A tabela de golpes (seção 8) é a única que muda a forma de mostrar, de cartões soltos para uma tabela com colunas fixas; vale o mesmo estilo de StatRow para não criar componente novo.
• A coluna "Total de golpes de definição" da planilha é W + EF + ENF por golpe.
• Na seção 8, aces e duplas faltas entram só na linha "Sq" para não dobrar a contagem das seções 1 e 7.
Ajuste na Devolução: o denominador de "pontos devolvidos" exclui dupla falta (não há devolução) e mantém o ace (a devolução não entrou). Hoje ReturnStats.totalPoints inclui os dois; o total de pontos com devolução da planilha segue a mesma regra.
Fase 3 – Tempos total e efetivo
O tempo sai do horário de registro de cada ponto (recordedAt), sem dado novo; o cálculo vai em um arquivo novo de src/core/report/ e entra na tabela de breakdown por set e no cabeçalho.
Métrica
Definição
Tempo total do jogo
Do registro do primeiro ponto (1º set) ao registro do último ponto, com todas as pausas
Duração de cada set
Do registro do primeiro ponto do set ao primeiro ponto do set seguinte (no último set, ao último ponto)
Tempo efetivo
Soma dos intervalos entre registros consecutivos, descartando os maiores que 90 s (constante MAX_GAP_SECONDS)
Tempo efetivo por set
Mesma soma, por set; o intervalo que atravessa dois sets não conta
Tempo efetivo por ponto
Tempo efetivo ÷ pontos com intervalo medido; o primeiro ponto do 1º set só marca o início e fica fora
Cuidados:
• Pontos desfeitos (voidedAt) já ficam fora da linha do tempo; confirmar que o intervalo seguinte a um ponto desfeito não infla o efetivo.
• Partida retomada (edição de placar) gera um intervalo longo: entra no total e sai do efetivo pelo limite.
• A duração por set de hoje (calculateSetDuration) passa a vir do mesmo cálculo para não haver dois números diferentes; o modal de resumo do set (computeSetSummary) usa uma segunda cópia da mesma conta e deve ser alinhado.
• Horário do aparelho com relógio errado é cortado pelo servidor (futuro vira "agora", passado anterior ao início vira o início); não há mais proteção que isso.
Limite do tempo efetivo: 90 s. O intervalo entre registros inclui o tempo que o anotador leva no modal de detalhes (cascata, nota, áudio); com 60 s, pontos bem detalhados sairiam do efetivo, e com 90 s eles entram e as trocas de lado (90 s regulamentares mais o ponto, em geral acima de 100 s) saem. O número é uma estimativa do ritmo, não o tempo de bola em jogo: rotular como "estimado" na tela, manter o limite como constante e conferi-lo com a distribuição dos intervalos de duas ou três partidas reais antes de fixar.
Fase 4 – Cabeçalho no topo da aba
O bloco do topo da aba Avançadas repete os dados da partida e acrescenta a duração total; o cabeçalho fixo da página (report-view-header.tsx) não muda.
• Conteúdo: modo de jogo (simples ou duplas, formato), data (início e fim), duração total (Fase 3), rodada, torneio, categoria, piso, temperatura e umidade, com os nomes dos jogadores ou duplas.
• Onde: um componente de apresentação no topo de AdvancedStats.tsx, usando os mesmos dados de ReportData (o endpoint já envia tudo, inclusive clubName).
• Exportar e imprimir: o bloco entra na mesma área que o usuário exporta ou imprime; o CSV atual (report-export.ts) lista pontos e não muda, salvo pedido seu.
Fase 5 – Duplas
O sistema já grava, por ponto, quem sacou (serverId), quem bateu o golpe que decidiu (hitterId), o lado da quadra (courtSide) e, só no Ponto Decisivo, quem devolveu (receiverId). Com isso dá para dividir parte das estatísticas por jogador da dupla; o que depende de posição na quadra não dá.
Métrica por jogador
Dá para medir?
Fonte
Saque: 1º saque, pontos ganhos, aces, duplas faltas
Sim
serverId de cada ponto
Winners, EF e ENF e tabela de golpes
Sim, nos pontos com hitterId
hitterId (do vencedor no winner; de quem errou no erro)
Pontos de Rede: winners e erros de voleio e smash
Sim, pelo hitterId
situação Rede + hitterId
Devolução por jogador
Em parte
o devolvedor só é gravado no Ponto Decisivo; os demais dá para derivar da ordem de saque, mas precisa confirmar na reconstrução da timeline
Pontos ganhos por lado (iguais ou vantagem), no saque e na devolução
Sim
courtSide
"Jogador da esquerda subiu X vezes"
Não
a posição de rede não é gravada; exigiria campo novo no modal
Decisões de desenho:
• Nomes das seções: em duplas, "Subidas à rede" e "Passadas" viram "Pontos de rede" e "Pontos de passada", por dupla, porque a ocupação da rede é padrão e não escolha.
• Pontos sem jogador atribuído: quando falta hitterId ou serverId, mostrar "não atribuído" com a contagem, para o total por jogador fechar com o total da dupla.
• Tela: cada seção ganha uma versão por dupla (como hoje) e, abaixo, uma tabela por jogador, no mesmo estilo de StatRow; sem componente novo.
• Formatos de duplas: os padrões são BEST_OF_3_NO_AD, SHORT_SET_2V2_NO_AD e BEST_OF_3_MATCH_TB. As correções 1.3, 1.4 e 1.15 precisam de testes para cada um (Ponto Decisivo, match tie-break de 10, set curto que começa em 2-2).
• Tempo: as regras de pausa e o tempo entre pontos não mudam em duplas, então a Fase 3 vale igual; a partida costuma ser mais curta (sem vantagem e match tie-break no lugar do 3º set).
• Interceção (poach): não há campo para ela; aparece apenas como Erro Forçado do devolvedor e winner de voleio do parceiro do sacador.
Testes, riscos e ordem de entrega
Cada fase entra como uma entrega separada, na ordem abaixo, com os testes de src/core/report/__tests__/ atualizados antes de cada tela.
1. Fase 1.2 e 1.1 primeiro, porque mudam números usados pelas demais; testes novos com pontos que carregam rallyDetails de ace e dupla falta, como vêm do banco.
2. Fase 1.3 a 1.7, com casos de game point em deuce, vantagem, Ponto Decisivo, tiebreak de 7 e de 10, e set point em formatos diferentes.
3. Fase 2, uma seção por vez, cada uma com seu teste de cálculo e sua tela.
4. Fase 3 e Fase 4, com testes de tempo (limite de 90 s, atravessar sets, partida retomada).
Riscos:
• Os testes de caracterização de pressão e de saque/devolução (*.characterization.test.ts) foram escritos sobre o comportamento atual e vão quebrar de propósito na Fase 1; cada mudança de valor esperado precisa ser justificada no teste.
• Os números de partidas antigas mudam, e quem comparou relatórios antes e depois vai ver diferença; vale avisar.
• A regra de game e set point é usada também na timeline, nos contadores ao vivo e no resumo do set; mudar point-ball-context.logic.ts afeta essas telas, então a Fase 1.3 e 1.4 deve criar funções novas por jogador e deixar as atuais até migrar os usos.
• Partidas em duplas: os totais por dupla seguem como acima e as estatísticas por jogador (com hitterId) estão na Fase 5 (Duplas).
Melhorias complementares
Não bloqueiam as fases, mas reduzem o risco de os números voltarem a divergir.
• Fonte única de estatísticas: relatório, resumo do set e aba Resumo passam a ler as mesmas funções de src/core/report/ (parte já prevista em 1.10 e 1.13).
• Desempenho: calcular os games concluídos uma vez por requisição e reaproveitar o resultado nas funções de saque, retorno e breakdown; hoje computeCompletedGames roda cerca de cinco vezes por jogador em cada GET do relatório.
• Testes com dados reais: um conjunto de pontos como vem do banco (ace e dupla falta com rallyDetails, tiebreak, partida retomada, duplas) usado por todos os testes de estatística; os atuais usam pontos sem esses detalhes e passam enquanto o código real erra.
• Nomes e cores: mostrar o nome do jogador onde hoje aparece J1/J2 e uma legenda de cores no topo da aba.
• CSV: depois de 1.12, incluir vencedor do ponto, tempo desde o ponto anterior e game point por jogador.