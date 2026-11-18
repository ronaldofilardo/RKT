# Plano de Implementação — Desmembramento de Espectador/Responsável e Indicação de Equipe Técnica

> **Código:** `PLANO_CADASTRO_RESPONSAVEL_ESPECTADOR_E_INDICACAO_2026-11-18`  
> **Data:** 2026-11-18 · **Status:** Pronto para Execução  
> **Metodologia:** Elephant-Goldfish Model (EGM) + STE-DEV (Regra R-03: $\le 100$ linhas por arquivo)  
> **Legislação de Referência:** LGPD (Lei nº 13.709/2018, Art. 14) e ECA Digital (Lei nº 15.211/2025)

---

## 1. Visão Geral e Objetivos do Negócio

Atualmente, na tela de cadastro (`/signup`), a opção de perfil agrupa *"Responsável / Espectador"* em um único valor (`ESPECTADOR`). Isso gera inconsistências funcionais e de governança:
1. **Espectador:** Quer apenas acompanhar jogos amadores ou do circuito, criar partidas próprias, anotar lances e compartilhar links públicos, sem vínculo de tutela de menores.
2. **Responsável Legal:** É o pai, mãe ou tutor legal de atleta menor de 18 anos que precisa exercer supervisão parental nos moldes da Lei nº 15.211/2025 (ECA Digital), necessitando escolher entre:
   - **Conta Básica de Acompanhamento** (`canOperate = false`): Foco em supervisão e proteção parental (quem marcou partidas, quando e onde, sem exibição de placares ponto a ponto ou telemetria tática).
   - **Conta de Espectador & Responsável** (`canOperate = true`): Permissão plena para visualizar transmissões ao vivo com placares ponto a ponto, relatórios detalhados e habilidade operacional de criar e anotar partidas.
3. **Indicação de Treinador ou Clube pelo Responsável:** O responsável pelo menor cadastrado de forma autônoma deve poder indicar a equipe técnica do dependente (clube/CT ou treinador particular), seja buscando no pool existente do RKT ou gerando um link direto de convite (via WhatsApp) para que o treinador externo passe a utilizar a plataforma e se vincule ao jovem.

---

## 2. Princípios de Governança, LGPD e ECA Digital

1. **Monotutela Estrita Preservada:**
   * Cada atleta menor pode ter exatamente **1 único responsável legal ativo** (`GuardianLink.status === 'ACTIVE'`).
   * No cadastro direto pelo pai/mãe em `/signup`, o sistema realiza validação cruzada por CPF ou código do menor para impedir cadastros duplicados ou sobreposição de tutela.
2. **Tríade de Consentimentos Imutáveis:**
   * `DATA` (Obrigatório): Registro da ficha esportiva do menor;
   * `BROADCAST` (Opcional): Transmissão ao vivo com pseudonimização estável (`Atleta #XXXXXX`);
   * `STATS` (Opcional): Inclusão em estatísticas agregadas ($N \ge 10$).
3. **Vínculo Esportivo com Treinador Particular:**
   * Treinador autônomo continua proibido de criar menores (bloqueio 403 por design).
   * A conexão do menor com o treinador particular parte do responsável via solicitação mútua (`CoachAthleteLink`).

---

## 3. Arquitetura da Solução e Fatiamento

Seguindo o padrão de isolamento já adotado no modal de gestor (`GestorOnboardingModal`), o formulário principal de `/signup` permanece leve e delega fluxos complexos para componentes modulares dedicados.

```
/signup ("Qual é o seu perfil?")
  ├── ATLETA         --> Cadastro padrão de atleta
  ├── TREINADOR      --> Cadastro de treinador particular
  ├── ESPECTADOR     --> Cadastro de espectador pleno (canOperate: true)
  ├── GESTOR         --> Abre GestorOnboardingModal (fluxo CT)
  └── RESPONSAVEL    --> Abre ResponsavelOnboardingModal
                          ├── Etapa 1: Dois Cards (Básico vs Espectador/Anotador)
                          ├── Etapa 2: Dados do Dependente Menor & Tríade
                          └── Etapa 3: Indicação de Treinador / Clube (Pool ou Link WhatsApp)
```

---

## 4. Fases Verticais de Implementação (Roadmap & DoD)

### Fase 1: Backend, Contratos Zod e Cadastro de Responsável Autônomo
* **Objetivo:** Permitir criação da conta de responsável via API com os dois modos de acesso e dependente menor.
* **Tarefas:**
  1. Atualizar schema de validação (`SignupSchema` em `src/app/api/auth/signup/route.ts`):
     - Adicionar `RESPONSAVEL` ao enum de `role`.
     - Suportar payload aninhado opcional `guardianProfile`:
       - `accessMode`: `'BASIC' | 'SPECTATOR'`
       - `minorName`: string (mínimo 3 caracteres)
       - `minorBirthDate`: string (ISO date com validação `isMinor === true`)
       - `minorCpf`: string opcional
       - `relationship`: `'PAI' | 'MAE' | 'TUTOR_LEGAL'`
       - `purposes`: array com `'DATA'`, e opcionalmente `'BROADCAST'` e `'STATS'`.
  2. Implementar transação atômica em `signup-post.logic.ts` (ou módulo derivado `signup-guardian.logic.ts` para respeitar R-03):
     - Criar `User` do responsável com `canOperate = (accessMode === 'SPECTATOR')`.
     - Verificar se menor já existe por CPF/dados ou criar `Player` provisório.
     - Checar monotutela: se já existir `GuardianLink` ativo para o menor, abortar com `409 CONFLICT`.
     - Criar `GuardianLink(status: ACTIVE, relation: relationship, verificationLevel: 'N1_CADASTRO_FAMILIAR')`.
     - Criar registros de auditoria e consentimento `ConsentRecord` com hash imutável.
* **DoD da Fase 1:**
  - Testes unitários puros cobrindo criação em modo `BASIC` (`canOperate = false`) e `SPECTATOR` (`canOperate = true`).
  - Bloqueio de duplicidade de tutela testado.
  - Arquivos $\le 100$ linhas (R-03).

---

### Fase 2: Backend — Endpoint de Busca no Pool e Convite de Treinador/Clube
* **Objetivo:** Fornecer rotas para o responsável encontrar clubes/treinadores existentes ou gerar links para externos.
* **Tarefas:**
  1. Criar rota de busca pública autenticada de entidades esportivas:
     - `GET /api/entities/search?q=...&type=ALL|CT|COACH`
     - Retorna CTs ativos e treinadores particulares que possuem visibilidade pública.
  2. Criar rota para vinculação ou emissão de convite pelo responsável:
     - `POST /api/guardians/me/indicate-staff`
     - Se CT existente: cria `PlayerCT(status: PENDING)`.
     - Se Treinador existente: cria `CoachAthleteLink(status: PENDING)`.
     - Se Treinador externo: gera convite assinado em tabela/token (`CoachInvitationToken`) e retorna URL para disparo via WhatsApp.
* **DoD da Fase 2:**
  - Endpoint de busca performático com limitação de resultados (máx. 10).
  - Vínculos criados em estado `PENDING` sem permitir acesso prematuro aos dados do menor antes do aceite.

---

### Fase 3: Frontend — Desmembramento de Perfis e Modal de Responsável
* **Objetivo:** Adaptar a tela `/signup` para desmembrar Espectador e Responsável, integrando os dois cards.
* **Tarefas:**
  1. Atualizar `signup-role-and-terms.tsx`:
     - Separar opções no `<select>`:
       - `<option value="ESPECTADOR">Espectador</option>`
       - `<option value="RESPONSAVEL">Responsável Legal (Menor de 18 anos)</option>`
  2. Criar `responsavel-onboarding-modal.tsx` (e subcomponentes $\le 100$ linhas):
     - **Passo 1 (`responsavel-step-mode.tsx`):**
       - Card 🛡️ Conta Básica (`canOperate = false`);
       - Card 🎾 Espectador & Responsável (`canOperate = true`);
       - Idêntico ao padrão visual de tokens `telemetry-*` de `AvisoAtivacaoForm`.
     - **Passo 2 (`responsavel-step-minor.tsx`):**
       - Nome do Menor;
       - Data de nascimento com validação imediata na interface;
       - Grau de parentesco (`PAI`, `MAE`, `TUTOR_LEGAL`);
       - Tríade de caixas de seleção (`DATA`, `BROADCAST`, `STATS`).
* **DoD da Fase 3:**
  - Acessibilidade do modal (`role="dialog"`, `aria-modal="true"`).
  - Validações inline em cada etapa.
  - Zero classes genéricas fora do Telemetry Design System.

---

### Fase 4: Frontend — Seção de Indicação de Equipe Técnica (Pool & WhatsApp)
* **Objetivo:** Adicionar a etapa final de indicação de treinador/clube.
* **Tarefas:**
  1. Criar componente `responsavel-step-staff.tsx`:
     - Seletor de tipo: *"Clube / CT cadastrado"*, *"Treinador Particular cadastrado"* ou *"Convidar novo Treinador via WhatsApp"*.
     - Busca com debounce para clubes e treinadores.
     - Campo de nome e WhatsApp do treinador externo com botão "Compartilhar Convite no WhatsApp" (`https://wa.me/?text=...`).
     - Opção "Pular esta etapa e configurar mais tarde no painel".
* **DoD da Fase 4:**
  - Link de WhatsApp validado e formatado com mensagem acolhedora.
  - Conclusão do cadastro redireciona para o painel parental (`/responsavel`).

---

### Fase 5: Validação Integral, Testes e Documentação
* **Tarefas:**
  1. Testes de integração de formulário com `@testing-library/react`.
  2. Verificação de linters e limites de linha: `pnpm check:r03` (100% dos novos arquivos $\le 100$ linhas).
  3. Verificação de tipagem TypeScript: `pnpm typecheck` (0 erros).
  4. Atualização dos documentos canônicos `TASKS.md`, `MEMORY.md` e `ARCHITECTURE.md`.

---

## 5. Matriz de Arquivos Previstos (Arquitetura STE-DEV $\le 100$ linhas)

| Arquivo | Responsabilidade | Linhas Estimadas |
| :--- | :--- | :---: |
| `src/app/signup/responsavel-onboarding-modal.tsx` | Orquestrador do modal de responsável em `/signup` | ~75L |
| `src/app/signup/responsavel-step-mode.tsx` | Seleção dos dois cards (Básico vs Espectador/Anotador) | ~65L |
| `src/app/signup/responsavel-step-minor.tsx` | Formulário do atleta dependente e consentimentos | ~85L |
| `src/app/signup/responsavel-step-staff.tsx` | Busca no pool e geração de link WhatsApp para treinador | ~90L |
| `src/app/api/auth/signup/signup-guardian.logic.ts` | Lógica pura de cadastro atômico do responsável e menor | ~80L |
| `src/app/api/entities/search/route.ts` | Endpoint de busca de CTs e treinadores do pool | ~65L |
| `src/app/signup/__tests__/responsavel-modal.test.tsx` | Suíte de testes do novo fluxo de responsável | ~90L |

---

## 6. Critérios de Aceite Globais (DoD Final)

- [x] Usuário que escolhe `ESPECTADOR` é cadastrado como espectador comum (`canOperate: true`, sem menor).
- [x] Usuário que escolhe `RESPONSAVEL` passa pelo modal com escolha obrigatória entre Conta Básica e Espectador/Anotador.
- [x] Cadastro do menor colhe a tríade de consentimentos e impede duplicidade de tutela (monotutela estrita).
- [x] Responsável consegue indicar clube/treinador existente ou gerar link de WhatsApp para treinador externo.
- [x] Todos os novos arquivos cumprem a Regra R-03 ($\le 100$ linhas).
- [x] `pnpm typecheck` 100% verde sem erros.

> **Status: CONCLUÍDO (2026-11-18).** Suíte completa 817/817 suites · 5053/5053 testes; migrations `20261118000000_add_coach_invitation_tokens` aplicada; follow-up N12 (página de resgate do convite) registrado em `TASKS.md`.
