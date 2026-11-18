# Plano de Implementação: Proteção de Menores (ECA Digital), Onboarding do Treinador Particular e Detecção de Contas no Gestor

- **Data de Criação:** 2026-11-18
- **Status:** Planejado / Aguardando Aprovação para Execução
- **Origem:** Investigação EGM (Elephant-Goldfish Model) em resposta à solicitação do usuário
- **Legislação & Governança:** Lei nº 15.211/2025 (ECA Digital), Lei nº 13.709/2018 (LGPD Art. 14), Regra R-03 ($\le 100$ linhas por arquivo), Design System Telemetria RKT

---

## 1. Visão Geral e Justificativa

A auditoria e investigação técnica revelou três necessidades críticas para blindar juridicamente a plataforma e aprimorar a experiência dos usuários:

1. **Treinador Particular & Bloqueio Proativo de Menores:**
   O backend já proíbe o cadastro de menores de 18 anos por treinadores (`POST /api/players` retorna 403 `FORBIDDEN`). No entanto, a UI permite o preenchimento integral do formulário antes de falhar, e não há termo formal de concordância legal no 1º acesso do profissional alertando sobre as implicações civis/criminais de coletas não autorizadas de dados de crianças/adolescentes.

2. **Saneamento do Cadastro de Atletas em `/signup`:**
   O formulário de cadastro de atletas em `/signup` coleta apenas nome, e-mail/CPF e senha, sem exigir data de nascimento. Isso possibilita que menores se autocadastrem como adultos com data nula, burlando a retenção parental da Lei 15.211/2025.

3. **Detecção Inteligente de Conta Existente no Gestor (`/gestor`):**
   Ao cadastrar atletas no CT, o gestor hoje força qualquer CPF existente para `status: 'ACTIVE'`, sem verificar se o CPF pertence a um responsável legal (pai/mãe), a um atleta menor com tutor ativo, ou a um dependente já registrado sem conta de usuário. É indispensável um classificador de perfis com fluxos diferenciados para cada cenário.

---

## 2. Divisão em Fatias Verticais (Slices)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FATIAS DE IMPLEMENTAÇÃO                         │
├────────────────────────────────────────────────────────────────────────┤
│ Fatia 1: Treinador Particular — UI Reativa e Termo de 1º Acesso        │
│ Fatia 2: Saneamento de Autocadastro de Atleta em /signup               │
│ Fatia 3: Gestor — Classificador Inteligente de Contas Existentes       │
│ Fatia 4: Provisionamento de Conta do Menor pelo Responsável            │
│ Fatia 5: Qualidade, Testes Automatizados e Documentação (DoD)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detalhamento Técnico das Fatias

### Fatia 1: Treinador Particular — UI Reativa e Termo de 1º Acesso

#### 1.1. Termo de Concordância do Treinador Particular no 1º Acesso
- **Banco de Dados / Auditoria:**
  - Registrar evento formal em `AuditLog`:
    - `action: 'COACH_ECA_TERMS_ACCEPTED'`
    - `actorUserId: user.id`
    - `resourceType: 'User'`
    - `meta: { termsVersion: '2.0', ipHash, userAgent }`
  - Criar helper `hasAcceptedCoachEcaTerms(userId: string): Promise<boolean>` consultando o `AuditLog`.
- **API:**
  - `GET /api/coach/particular/onboarding-status`: Retorna `{ accepted: boolean }`.
  - `POST /api/coach/particular/accept-terms`: Grava o aceite e retorna `{ success: true }`.
- **Frontend (`/treinador`):**
  - Componente modal `CoachEcaTermsModal.tsx` ($\le 90$ linhas):
    - Bloqueante na primeira visita à área `/treinador` se `accepted === false`.
    - **Conteúdo Jurídico:**
      - Destaque das exigências do ECA Digital (Lei nº 15.211/2025);
      - Proibição absoluta de cadastrar menores de 18 anos como pessoa física;
      - Ciência das penalidades civis, criminais e suspensão imediata da conta em caso de burla ou uso de dados de terceiros;
      - Instrução de que o vínculo com atletas menores deve ser iniciado pelo Responsável Legal do atleta através de indicação no app.
    - Checkbox obrigatório: `"Declaro que li e concordo com as diretrizes do ECA Digital e estou ciente das penalidades legais pelo descumprimento."`
    - Botão: `"Confirmar e Acessar Plataforma"`.

#### 1.2. Bloqueio Reativo no Modal de Novo Atleta (`NewAthleteModalForm.tsx`)
- **Detecção de Papel:**
  - O modal recebe `isParticularCoach: boolean` (ou extrai do contexto ativo `TREINADOR_AVULSO` / sem CT).
- **Banner Educativo Fixo:**
  - Se `isParticularCoach === true`, renderiza no topo do formulário:
    ```
    ℹ️ Treinador Particular: O ECA Digital veda o cadastro de atletas menores
    de 18 anos por treinadores avulsos. O cadastro deve ser feito pelo responsável.
    ```
- **Validação Instantânea de Nascimento:**
  - Em `useNewAthleteModalForm.ts`, ao preencher dia/mês/ano:
    - Se a idade calculada for `< 18 anos`:
      - Desabilita o botão `"Salvar Atleta"`;
      - Exibe alerta vermelho em tempo real:
        ```
        ⚠️ Atleta menor de idade (X anos). Treinadores particulares não podem
        cadastrar menores. Solicite ao responsável legal cadastrar o dependente
        em rkt.com/signup e indicar você como treinador.
        ```

---

### Fatia 2: Saneamento de Autocadastro de Atleta em `/signup`

#### 2.1. Coleta Obrigatória de Data de Nascimento para Atletas
- **Frontend (`src/app/signup/`):**
  - No formulário `SignupFormFields`, quando `role === 'ATLETA'`, incluir campo estruturado de Data de Nascimento (`birthDate`).
  - Validação em tempo de digitação via `signup-validation.logic.ts`.
- **Interceptação de Menores em `/signup`:**
  - Se a data informada indicar `< 18 anos`:
    - Bloqueia o avanço do cadastro direto como adulto;
    - Abre modal informativo ou card com aviso legal:
      ```
      ⚠️ Identificamos que você tem X anos.
      Por força do ECA Digital e da LGPD, o cadastro de atletas menores de 18 anos
      deve ser realizado pelo seu pai, mãe ou responsável legal.
      ```
    - Fornece botão de atalho direto: `"Criar Conta com meu Responsável"`, que redireciona para `/signup?perfil=RESPONSAVEL`.
- **Salvaguarda no Backend (`src/app/api/auth/signup/signup-athlete.logic.ts`):**
  - Exigir `birthDate` obrigatório para novas contas de `ATLETA`.
  - Se `isMinor(birthDate, now) === true`, rejeitar com status 403 `MINOR_REQUIRES_GUARDIAN` com mensagem orientativa.

---

### Fatia 3: Gestor — Classificador Inteligente de Contas Existentes

#### 3.1. Arquitetura da Consulta no Backend (`src/app/api/gestor/athletes-logic.ts`)
Substituir a consulta ingênua `prisma.user.findUnique({ where: { cpf } })` por uma verificação em camadas:

```ts
export type ExistingAccountKind =
  | 'NONE'
  | 'ADULT_ATHLETE'
  | 'MINOR_WITH_GUARDIAN'
  | 'GUARDIAN_USER'
  | 'DEPENDENT_PLAYER_WITHOUT_USER';
```

1. **Camada 1 — Busca em `User` por CPF:**
   - Se encontrar `User`:
     - **Caso A (Responsável Legal):**
       Se `user.role === 'RESPONSAVEL'` ou possui `guardianLinks` como guardião:
       - Retorna `kind: 'GUARDIAN_USER'`, com nome e e-mail do responsável.
       - Ação: **Bloquear vinculação direta como jogador**. Mensagem: *"Este CPF pertence ao Responsável Legal [Nome]. Para cadastrar o atleta menor, insira o CPF do dependente."*
     - **Caso B (Atleta Menor com Responsável Ativo):**
       Se `user.athleteProfile` é menor de 18 anos e possui `guardianLinks` ativos:
       - Retorna `kind: 'MINOR_WITH_GUARDIAN'`, com nome do menor e nome do responsável legal.
       - Ação: **Não forçar vínculo ACTIVE**. Criar `PlayerCT` com `status: 'PENDING'` e notificar o responsável legal cadastrado (exibido na aba Avisos de `/responsavel`) para autorizar a filiação ao novo CT.
     - **Caso C (Atleta Adulto):**
       Se `user.athleteProfile` tem $\ge 18$ anos:
       - Retorna `kind: 'ADULT_ATHLETE'`.
       - Ação: Confirmação padrão e criação de vínculo `PlayerCT` `ACTIVE`, com disparo de notificação ao atleta.
2. **Camada 2 — Busca em `Player` por `cpfHash` (quando `User` não existe):**
   - Se não encontrar `User`, mas encontrar `Player` com `cpfHash`:
     - **Caso D (Menor Dependente sem Conta Própria):**
       O menor foi cadastrado pelo pai via `/signup` (A0.21) e já tem `GuardianLink` e consentimentos da Tríade gravados, mas `Player.userId === null`.
       - Retorna `kind: 'DEPENDENT_PLAYER_WITHOUT_USER'`.
       - Ação: Aproveita o `Player` existente (sem duplicar no banco) e cria `PlayerCT` com `status: 'PENDING'`, enviando aviso de aceite ao responsável.

#### 3.2. Interface do Gestor (`cadastrar-membro-link-prompt.tsx`)
Reescrever o diálogo de prompt para renderizar a interface de acordo com o `kind`:
- **Card Azul/Verde (Adulto):** `"Atleta encontrado no RKT. Deseja adicioná-lo ao elenco do clube?"`
- **Card Amarelo (Menor com Responsável):** `"Atleta menor de idade sob tutela de [Nome do Responsável]. Ao confirmar, uma solicitação de filiação será enviada para aprovação do responsável legal."`
- **Card Vermelho (CPF de Responsável):** `"Este CPF pertence ao responsável legal [Nome] e não a um atleta. Por favor, solicite ou insira os dados do dependente."` (Botão de confirmação desabilitado).
- **Card Lilás (Dependente já cadastrado):** `"Atleta dependente localizado (cadastrado pelo responsável [Nome]). Deseja solicitar vínculo do atleta ao seu clube?"`

---

### Fatia 4: Habilitação de Conta do Menor pelo Responsável Legal

- **Contexto:** Menores cadastrados pelo pai em `/signup` nascem como dependentes sem login próprio (`Player.userId === null`).
- **Endpoint:** `POST /api/guardians/me/dependents/[id]/provision-account`
  - Valida se o usuário autenticado tem tutela ativa sobre o menor;
  - Gera credencial com e-mail próprio do menor ou `<cpf>@local`, senha temporária (data de nascimento `DDMMAAAA`) e flag `mustChangePassword: true`;
  - Vincula o novo `User.id` ao `Player.userId`;
  - Registra em `AuditLog` o evento `ACCOUNT_ACTIVATED_BY_GUARDIAN`.
- **Frontend em `/responsavel` (Aba 4 — Acessos):**
  - Quando a conta do dependente estiver como `"Acesso Não Habilitado"`, renderizar botão:
    `"🔑 Habilitar Login do Menor no Aplicativo"`
  - Ao clicar, exibe modal com o link de primeiro acesso e senha temporária para o pai entregar ao filho com segurança.

---

## 4. Matriz de Impacto e Arquivos Envolvidos

| Arquivo | Mudança Prevista | Linhas Atuais | Meta R-03 |
|---|---|---|---|
| `src/app/api/coach/particular/onboarding-status/route.ts` (novo) | Consulta de aceite do termo do treinador | Novo | $\le 45$L |
| `src/app/api/coach/particular/accept-terms/route.ts` (novo) | Gravação de aceite do termo no `AuditLog` | Novo | $\le 50$L |
| `src/app/treinador/coach-eca-terms-modal.tsx` (novo) | Modal de aceite obrigatório do ECA Digital | Novo | $\le 85$L |
| `src/app/match/new/components/new-athlete-personal-fields.tsx` | Alerta reativo de menor para treinador particular | 78L | $\le 95$L |
| `src/app/signup/signup-form-fields.tsx` | Inclusão de campo de data de nascimento | 90L | Modularizar |
| `src/app/signup/signup-minor-warning-modal.tsx` (novo) | Alerta bloqueante para menores em autocadastro | Novo | $\le 60$L |
| `src/app/api/gestor/athletes-account-check.logic.ts` (novo) | Classificador em 4 perfis de conta existente | Novo | $\le 90$L |
| `src/app/api/gestor/athletes-logic.ts` | Integração do classificador de contas | 74L | $\le 85$L |
| `src/app/gestor/cadastrar-membro-link-prompt.tsx` | Interface adaptativa por perfil de conta existente | 67L | $\le 95$L |
| `src/app/api/guardians/me/dependents/[id]/provision-account/route.ts` (novo) | Endpoint para pai emitir credencial do filho | Novo | $\le 75$L |
| `src/app/responsavel/guardian-tab-acessos.tsx` | Botão para habilitar credencial do dependente | 93L | $\le 95$L |

---

## 5. Critérios de Aceite e Definição de Pronto (DoD)

1. [ ] **Treinador Particular:**
   - Treinador sem aceite não consegue interagir em `/treinador` sem antes aceitar o termo do ECA Digital;
   - No modal de novo atleta, digitar nascimento $< 18$ anos desabilita imediatamente o botão "Salvar" e exibe a mensagem de impedimento legal.
2. [ ] **Autocadastro em `/signup`:**
   - Atletas menores de 18 anos são impedidos de criar conta autônoma adulta sem tutor;
   - Mensagem clara redireciona para a conta de Responsável Legal.
3. [ ] **Gestor (`/gestor`):**
   - Ao digitar CPF existente de pai/mãe, o sistema bloqueia e orienta o gestor;
   - Ao digitar CPF existente de menor sob tutela, o sistema gera vínculo `PENDING` e notifica o responsável na aba Avisos;
   - Ao digitar CPF de menor já cadastrado como dependente sem login, não cria registro duplicado no banco.
4. [ ] **Responsável (`/responsavel`):**
   - Pai consegue habilitar o primeiro acesso do dependente na Aba 4 (Acessos).
5. [ ] **Qualidade de Código:**
   - Todos os arquivos novos e alterados rigorosamente $\le 100$ linhas cruas (`pnpm check:r03` = 0 violações);
   - Zero erros no TypeScript (`pnpm typecheck`);
   - Testes unitários cobrindo o classificador de contas e os novos endpoints com 100% de aprovação.
