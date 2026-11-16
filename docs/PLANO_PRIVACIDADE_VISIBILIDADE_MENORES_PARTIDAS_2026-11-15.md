# Plano de Implementação: Governança, Tutela e Privacidade de Atletas Menores

> **Status:** Aprovado para Execução  
> **Data:** 2026-11-15  
> **Metodologia:** STE-DEV (Testes primeiro, arquivos $\le 100$ linhas, tipagem estrita, suíte 100% verde, sem regressão)  
> **Domínio Esportivo:** Tênis e Esportes de Raquete (Simples e Duplas, Sets, Games, Tiebreak, No-Ad)  
> **Legislação de Referência:** LGPD (Lei 13.709/2018, Art. 14) e ECA Digital (Lei 15.211/2025).

---

## 1. Visão Geral e Regras Canônicas

### 1.1 Círculo Restrito de Acesso ao Nome Real
Em qualquer partida de tênis registrada na plataforma que envolva um ou mais atletas **menores de 18 anos** (`isMinor = true`), o nome civil real do atleta menor **somente** é visível para os usuários diretamente envolvidos na partida:
- **Gestor do Centro de Treinamento (CT):** Gestor ativo do CT onde a partida é disputada ou dos CTs vinculados aos atletas da partida (`PlayerCT`).
- **Treinadores Vinculados:** Treinadores com vínculo ativo de acompanhamento (`CoachAthleteLink`) com os atletas da partida.
- **Atletas Participantes:** Os próprios atletas em quadra (o menor, seu parceiro de duplas e seus adversários diretos na partida).
- **Responsável Legal:** Usuário com vínculo de tutela ativo (`GuardianLink.status = ACTIVE`) do atleta menor.

### 1.2 Compartilhamento e Acesso Externo — Randomização Obrigatória
Se a partida for compartilhada (via link público `MatchShareLink`, QR code, feed de espectador ao vivo ou visualizada por qualquer usuário não pertencente ao círculo direto):
- **O nome de todo atleta menor participante DEVE ser obrigatoriamente randomizado** (ex.: `Atleta #8B2E`).
- A randomização substitui máscaras frágeis (como iniciais `A. S.` ou `A***`), impedindo inferência e cruzamento de dados em categorias de base de tênis (CBT/federações locais).
- O pseudônimo é **estável dentro da partida** para que espectadores acompanhem a pontuação (games, sets e tiebreaks), mas **independente entre partidas** para evitar rastreamento longitudinal.

### 1.3 Monotutela Estrita na Plataforma
- Cada atleta menor possui **exatamente 1 único responsável legal** registrado na plataforma.
- Não há múltiplos responsáveis simultâneos, evitando divergências ou litígios familiares concorrentes.
- A substituição de responsável exige revogação expressa do vínculo anterior (`status = REVOKED`) ou intervenção formal do suporte/jurídico.

---

## 2. Cadastro do Menor pelo Gestor: Coleta Prévia do Responsável

Quando o Gestor do CT cadastra um atleta menor de 18 anos no painel do clube, o sistema aciona uma etapa obrigatória de coleta dos dados prévios do responsável.

```
                  CADASTRO DE MENOR PELO GESTOR
                                │
                                ▼
           Gestor insere Nome, CPF e Nascimento do Menor
                                │
                                ▼ [isMinor = true]
     ┌──────────────────────────────────────────────────────┐
     │  Abertura da Seção: Dados do Responsável Legal       │
     │  - Nome Completo do Responsável                      │
     │  - CPF do Responsável (com validação)                │
     │  - Telefone / WhatsApp com DDD                       │
     │  - Contato Adicional / E-mail                        │
     │  - Atestação: "Conferi o documento oficial do menor" │
     └──────────────────────────┬───────────────────────────┘
                                │
                                ▼
            Persistência em guardian_invites (Dados de Cruzamento)
            + Geração de Convite (72h, Link/WhatsApp e QR Code)
```

### 2.1 Modelo de Dados para Cruzamento (`guardian_invites`)
Os dados informados pelo gestor são persistidos para cruzamento de segurança:

```prisma
model GuardianInvite {
  id                  String         @id @default(cuid())
  playerId            String
  ctId                String?
  createdByUserId     String         // ID do Gestor ou do Menor
  createdByKind       InviteCreatorKind // GESTOR | MENOR
  
  // Dados pré-cadastrados para validação cruzada:
  preGuardianName     String?        // Nome informado pelo gestor
  preGuardianCpf      String?        // CPF cifrado (AES-GCM)
  preGuardianCpfHash  String?        // HMAC-SHA256 para busca e match seguro
  preGuardianPhone    String?        // Telefone/WhatsApp do responsável
  preGuardianContact  String?        // Contato adicional/e-mail
  
  tokenHash           String         @unique
  codeHash            String
  expiresAt           DateTime       // createdAt + 72h
  verificationHoldUntil DateTime?    // Extensão máx. +24h durante validação
  usedAt              DateTime?
  guardianUserId      String?        // Preenchido quando o responsável conclui
  
  player              Player         @relation(fields: [playerId], references: [id], onDelete: Restrict)
  ct                  TrainingCenter? @relation(fields: [ctId], references: [id], onDelete: Restrict)
  
  @@index([playerId])
  @@index([preGuardianCpfHash])
  @@map("guardian_invites")
}

enum InviteCreatorKind {
  GESTOR
  MENOR
}
```

### 2.2 Regras de Cruzamento Cadastral
1. **Cruzamento Local (Fase 1 / Release 1):** Quando o responsável acessa o convite e informa seu CPF, o sistema valida se `HMAC(cpf)` confere com `preGuardianCpfHash`. Se divergir, o aceite é bloqueado com mensagem de orientação ao gestor.
2. **Cruzamento Governamental (Fase 4 / SERPRO):** O par `(preGuardianCpf, preGuardianName)` será validado via API oficial da Receita Federal para certificar a correspondência antes da emissão definitiva do vínculo.

---

## 3. Emissão Dupla de Links no Painel do Gestor (`/gestor` ➔ Atletas)

Na aba **Atletas** do painel do Gestor, o botão de ação **"Link"** para atletas menores de 18 anos opera de forma diferenciada:

```
                      GESTOR CLICA EM "LINK"
                        (Atleta Menor de Idade)
                                  │
                                  ▼
                POST /api/gestor/athletes/:id/links
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
         [ LINK 1: MENOR ]                 [ LINK 2: RESPONSÁVEL ]
     "Ativação de Conta do Menor"       "Aviso de Ativação ao Responsável"
                 │                                 │
                 ▼                                 ▼
    /ativar-conta/[tokenMenor]        /responsavel/aviso-ativacao/[tokenAviso]
    - Menor define senha segura       - Tela informativa / recibo de ciência
    - Desbloqueia acesso ao app       - Mostra quem consentiu e autorizações
                                      - Sem necessidade de novo consentimento
```

### 3.1 Especificação do Link 1: Ativação da Conta do Menor
- **Finalidade:** Permite ao atleta menor criar sua credencial de acesso e definir sua senha pessoal.
- **Pré-requisito:** Só pode ser gerado se o responsável legal já tiver emitido consentimento ativo (`GuardianLink ACTIVE` e consentimento `DATA` concedido). Se o menor ainda estiver aguardando autorização, o botão exibe o status de espera e permite reenviar o convite de tutela ao pai.
- **Segurança:** Senha temporária aleatória de alta entropia (mín. 12 caracteres), entregue diretamente pelo link (nunca data de nascimento e nunca entregue em texto ao gestor).

### 3.2 Especificação do Link 2: Aviso de Ciência ao Responsável
- **Finalidade:** Cumprir o dever de supervisão parental (ECA Digital), notificando o responsável legal de que o filho está ativando sua credencial de acesso.
- **Natureza da Tela:** **Estritamente informativa (recibo de ciência)**. Não exige preenchimento de formulário nem emissão de novo consentimento, pois a autorização já foi realizada previamente no wizard de tutela.
- **Conteúdo Exibido na Tela (`/responsavel/aviso-ativacao/[token]`):**
  1. **Cabeçalho Oficial:** *"Acompanhamento Parental · Ativação de Acesso"*
  2. **Identificação do Menor:** Nome do filho, CT vinculado e data/hora da emissão da credencial.
  3. **Mensagem de Transparência:**
     > *"Informamos que um link de ativação de conta no RKT foi gerado para seu(sua) filho(a) [Nome do Menor]. Com esta credencial, ele(a) poderá visualizar suas partidas e estatísticas esportivas."*
  4. **Recibo de Autorizações Vigentes:**
     - **Responsável que autorizou:** Nome e CPF mascarado (`***.456.789-**`) do responsável vinculado.
     - **Dados Esportivos (`DATA`):** Autorizado.
     - **Transmissão Pública (`BROADCAST`):** [Autorizado / Não Autorizado].
     - **Estatísticas Agregadas (`STATS`):** [Autorizado / Não Autorizado].
  5. **Canal de Segurança:** Botão para acesso ao painel do responsável caso queira revogar ou ajustar permissões.
  6. **Auditoria:** Gravação do evento `GUARDIAN_ACTIVATION_NOTICE_VIEWED` ao carregar a página.

### 3.3 Modal do Gestor (`AthletesMinorLinksModal`)
O modal exibe os dois blocos com botões de cópia e disparo rápido para WhatsApp:
- **Bloco 1 (Atleta):** Link com validade de 48h + botão *"Enviar para WhatsApp do Atleta"*.
- **Bloco 2 (Responsável):** Link com validade de 7 dias + botão *"Enviar Aviso para WhatsApp do Responsável"* (utilizando o telefone pré-cadastrado no cadastro inicial).

---

## 4. Fluxos de Cadastro por Ator

### 4.1 Pelo Gestor do CT (Fluxo Institucional)
1. Gestor insere dados do menor e os dados prévios do responsável.
2. Atesta a conferência do documento oficial.
3. Sistema gera `Player` provisório e `GuardianInvite` (72h, com link e QR Code presencial).
4. Responsável acessa, se autentica, atesta parentesco e conclui wizard (`DATA` obrigatório).
5. Convite passa imediatamente a `USED` (invalidação atômica).
6. Gestor passa a ter acesso aos 2 links de ativação e ciência na aba de Atletas.

### 4.2 Pelo Treinador Particular / Autônomo (Bloqueio por Design)
1. O treinador particular atua sem personalidade jurídica institucional de CT/clube e não possui alçada para assumir tutela civil de menores.
2. Ao digitar uma data de nascimento com menos de 18 anos (`isMinor = true`), o formulário de cadastro é **imediatamente interrompido**.
3. **Mensagem Contextualizada:**
   > *"Como treinador particular, você não precisa se preocupar com a burocracia de tutela. Por exigência legal (ECA Digital / LGPD), atletas menores de idade devem criar a própria conta diretamente pelo aplicativo (ou solicitar aos pais).*  
   > *Assim que o responsável autorizar o jovem, você poderá solicitar o vínculo de acompanhamento esportivo diretamente pelo perfil dele."*
4. **Vínculo Esportivo Posterior:** O treinador busca o atleta pelo `athleteCode` e envia a solicitação `CoachAthleteLink`, que depende de aprovação do responsável/menor.

### 4.3 Pelo Próprio Menor (Autocadastro)
1. Menor preenche `/signup` com seus dados pessoais.
2. Sistema cria o registro com trava: `Player.guardianGate = 'AGUARDANDO_RESPONSAVEL'`.
3. Menor é redirecionado compulsoriamente para `/aguardando-responsavel`.
4. **Aviso Explícito de Monotutela:**
   > ⚠️ **Atenção: Apenas 1 responsável pode ser cadastrado.**  
   > *"Envie este convite para o seu pai, sua mãe ou seu tutor legal que acompanhará seus jogos. Uma vez aprovado, este será o único responsável com acesso às suas autorizações na plataforma."*
5. Menor gera o convite único (`POST /api/minors/me/guardian-invite`, 72h, máx. 3 por dia).
6. Pai acessa e autoriza; a trava é liberada (`LIBERADO`).

---

## 5. Operação de Partidas, Integridade e Ciclo de Vida

### 5.1 Continuidade Atômica da Partida em Andamento (Sem Quarentena de Pontos)
- O motor de scoring de tênis (`ScoringEngine` em `src/core/engine.ts`) é estritamente sequencial (`PointLog.sequenceNumber`).
- **Regra:** Se o responsável revogar o consentimento `DATA` durante uma partida em andamento, **os pontos continuam sendo registrados normalmente até o final do jogo**.
- A projeção pública muda **imediatamente para o nome randomizado** (`Atleta #XXXX`).
- Partidas subsequentes ficam bloqueadas pelo gate (`MINOR_GATE_BLOCKED`).
- **Justificativa:** Protege a integridade da partida e o resultado esportivo do adversário sem violar a privacidade visual do menor.

### 5.2 Emancipação Atômica aos 18 Anos
1. Ao completar 18 anos exatos (`isMinor = false`):
   - `GuardianLink.status = 'EMANCIPATED'`, `emancipatedAt = now()`.
   - O painel parental perde o acesso de visualização sobre o jovem maior de idade.
2. No próximo login do jovem:
   - Redirecionamento obrigatório para tela de gestão civil: *"Você completou 18 anos! Agora você é o único responsável pelos seus dados e autorizações no RKT."*
   - O atleta assina seus próprios consentimentos (`DATA`, `BROADCAST`, `STATS`).

### 5.3 Invalidação Imediata do Convite Pós-Aceite
- Assim que o responsável conclui o aceite no wizard, a transação marca atomicamente `GuardianInvite.usedAt = now()`.
- O token torna-se imediatamente inválido para novos acessos, impedindo qualquer reaproveitamento de link.

### 5.4 Sanitização Antecipada dos Logs de Auditoria (Fase 1)
- O modelo `AuditLog.meta` deixa de armazenar CPF ou nomes em texto puro.
- Rotina na Fase 1 higieniza registros legados de `ATLETA_DADOS_ATUALIZADOS`, substituindo PII por identificadores opacos (`resourceId`).

---

## 6. Algoritmo de Randomização de Nomes de Menores

### 6.1 Implementação (`src/core/access/minor-name-randomizer.ts`)
```typescript
import { createHmac } from 'crypto';

/**
 * Gera um pseudônimo estável para um atleta menor dentro do contexto de uma partida.
 * Exemplo de saída: "Atleta #8F2A"
 */
export function randomizeMinorPlayerName(matchId: string, playerId: string, salt = 'RKT_SPECTATOR_SALT'): string {
  const hash = createHmac('sha256', salt)
    .update(`${matchId}:${playerId}`)
    .digest('hex');
  const code = hash.slice(0, 4).toUpperCase();
  return `Atleta #${code}`;
}
```

### 6.2 Resolução de Nomes (`src/core/access/minor-name-resolver.ts`)
```typescript
export interface ResolvePlayerDisplayNameParams {
  player: { id: string; name: string; birthDate?: Date | string | null };
  matchId: string;
  isDirectlyInvolved: boolean;
  now?: Date;
}

export function resolvePlayerDisplayName(params: ResolvePlayerDisplayNameParams): string {
  const { player, matchId, isDirectlyInvolved, now = new Date() } = params;
  const minor = isMinor(player.birthDate ? new Date(player.birthDate) : null, now);

  if (!minor) return player.name;
  if (isDirectlyInvolved) return player.name;
  return randomizeMinorPlayerName(matchId, player.id);
}
```

---

## 7. Fases de Execução STE-DEV

Cada fase conclui obrigatoriamente com arquivos $\le 100$ linhas, testes Jest verdes e typecheck limpo.

```
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 0: Fechamento de Brechas & Testes de Caracterização               │
│ - Revogar guardian:link de TREINADOR e SUPORTE no profile-matrix.       │
│ - Remover autoaprovação de menores em /api/guardians/link/confirm.     │
│ - Bloquear criação de menores por treinadores em POST /api/players.    │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 1: Banco de Dados & Sanitização de Auditoria                      │
│ - Migração Prisma: GuardianInvite (com preGuardian* e 72h).            │
│ - Migração Prisma: ConsentEvent (append-only) e UNIQUE em GuardianLink.│
│ - Sanitizar AuditLog.meta removendo CPF/nome em claro.                 │
│ - Liberar rotas públicas de convite e aviso no middleware.ts.          │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 2: Domínio de Privacidade & Randomização                          │
│ - minor-name-randomizer.ts, match-involvement.ts, minor-name-resolver.ts│
│ - spectator-projection.ts atualizado para aplicar randomização.        │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 3: Cadastro do Gestor & Coleta Prévia do Responsável              │
│ - Formulário do gestor com campos do responsável para menores.         │
│ - Geração de convite com QR Code presencial e link WhatsApp.           │
│ - Validação cruzada do CPF do responsável no aceite.                   │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 4: Emissão Dupla de Links no Painel do Gestor                     │
│ - Endpoint POST /api/gestor/athletes/:id/activation-links.             │
│ - AthletesMinorLinksModal exibindo Link 1 (Menor) e Link 2 (Aviso Pai). │
│ - Página pública de ciência: /responsavel/aviso-ativacao/[token].      │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 5: Autocadastro do Menor & Monotutela                             │
│ - Tela /aguardando-responsavel com aviso explícito de 1 responsável.   │
│ - Emissão do convite único pelo menor (72h).                           │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 6: Transição de Maioridade & Verificação E2E                      │
│ - Gatilho de emancipação (EMANCIPATED) aos 18 anos.                    │
│ - Testes Playwright ponta a ponta (Gestor, Menor, Pai, Espectador).    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Matriz de Testes Obrigatórios

| Teste | Cenário Avaliado | Perfil / Condição | Resultado Esperado |
|---|---|---|---|
| T1 | Visualização de partida com menor | Gestor do CT da partida | Nome real visível |
| T2 | Visualização de partida com menor | Treinador com vínculo ativo | Nome real visível |
| T3 | Visualização de partida com menor | O próprio atleta ou adversário | Nome real visível |
| T4 | Visualização de partida com menor | Responsável legal ativo | Nome real visível |
| T5 | Compartilhamento / Link público | Espectador anônimo / Terceiro | Nome randomizado (`Atleta #XXXX`) |
| T6 | Cadastro de menor pelo gestor | Idade < 18 anos | Exige dados prévios do pai e atestação |
| T7 | Aceite do responsável | CPF divergente do pré-cadastrado | Aceite bloqueado por divergência |
| T8 | Botão Link na aba Atletas | Atleta Menor com consentimento | Gera 2 links: Ativação + Aviso Responsável |
| T9 | Tela de Aviso do Responsável | Acesso via token de aviso | Exibe recibo de ciência sem pedir novo consentimento |
| T10 | Cadastro por Treinador Particular | Idade < 18 anos | Bloqueio imediato com mensagem orientativa |
| T11 | Autocadastro do Menor | Idade < 18 anos | Trava em `/aguardando-responsavel` com aviso de Monotutela |
| T12 | Menor completa 18 anos | Atleta atinge maioridade | Vínculo vira `EMANCIPATED` e pai perde visualização |
| T13 | Revogação durante a partida | Jogo em andamento | Partida vai até o fim com projeção anônima |

---

## 9. Definição de Pronto (Definition of Done - DoD)

1. **Zero Vazamento de Menores:** Nenhuma rota pública ou feed de espectador expõe o nome real de menores fora do círculo restrito.
2. **Duplo Link Operacional:** Gestor emite o link de ativação do menor e o link de ciência do responsável diretamente no painel.
3. **Monotutela Garantida:** O banco bloqueia múltiplos responsáveis ativos para o mesmo atleta menor.
4. **Continuidade de Jogo Assegurada:** Nenhuma partida de tênis é corrompida ou interrompida por alterações de consentimento em tempo real.
5. **Conformidade STE-DEV:** 100% dos arquivos com $\le 100$ linhas, testes verdes (`pnpm test`) e tipagem sem falhas (`pnpm typecheck`).
