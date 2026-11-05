# Plano de Implementação: Revisão Geral de UX Writing no RKT

**Data:** 05/11/2026  
**Status:** Planejado / Pronto para Execução  
**Documentos de Referência:** [docs/PRD.md](PRD.md) | [docs/RULES.md](RULES.md) | [docs/DESIGN.md](DESIGN.md) | [docs/ARCHITECTURE.md](ARCHITECTURE.md) | [docs/MEMORY.md](MEMORY.md)

---

## 🎯 Contexto e Objetivos

Este plano formaliza a revisão completa de **UX Writing** no ecossistema RKT. O objetivo principal é desmistificar e humanizar a linguagem de todo o produto, eliminando jargões operacionais internos, termos técnicos e mensagens mecânicas.

### Princípios Canônicos Aplicados (RULES.md & DESIGN.md)
1. **Linguagem Centrada no Usuário:** Substituição de termos internos do sistema (ex.: "anotação suspensa", "contexto de atuação", "área") por conceitos naturais ao tenista, treinador ou gestor (ex.: "partida pausada", "perfil").
2. **Padrão de Capitalização (Sentence Case):** Rótulos e botões passam a adotar exclusivamente a primeira palavra maiúscula (ex.: `Copiar link`, `Salvar e sair`), exceto siglas consagradas e nomes próprios.
3. **Respeito ao Telemetry Design System:** Não introduzir classes de Tailwind proibidas (`bg-gray-*`, `text-blue-*`) ao alterar componentes visuais.
4. **Alinhamento em Paridade com Testes (Anti-quebra):** Alterações de texto na interface devem atualizar no mesmo passo as asserções de testes unitários, testes de componentes e testes E2E do Playwright.

---

## 📖 Glossário Editorial Oficial

| Termo Interno / Anterior | Como Exibir ao Usuário | Justificativa |
| :--- | :--- | :--- |
| `anotação / anotador` | Visível apenas para ADMIN/suporte; para atletas e público geral: **partida** | Atletas e espectadores acompanham partidas, não "anotações". |
| `sessão suspensa` / `anotação suspensa` | **Partida pausada** | Conceito universal e compreensível. |
| `contexto de atuação` | **Perfil** ou **Como você quer entrar?** | Elimina jargão burocrático e corporativo. |
| `área` (em `/escolher-area`) | **Perfil** | Consistência com o seletor de login. |
| `dashboard` | Nunca expor diretamente; usar **painel** ou simplesmente **← Voltar** | Termo técnico desnecessário no botão de retorno. |
| `CT` | **Clube / Centro de Treinamento** na 1ª menção; **clube** nas seguintes | Clareza contextual. |
| `vínculo` | **Perfil** (na seleção de login); **clube** (no contexto do gestor) | Remove ambiguidade sobre o que está vinculado. |

---

## 📋 Mapeamento Completo de Mudanças

### 1. Login e Autenticação
* **Tela de Login (`src/app/login/page.tsx`):**
  * Subtítulo: `Acesse com seu e-mail ou CPF` ➔ `Entre com e-mail ou CPF`
  * Rodapé: `Ainda não tem conta?` ➔ `Novo no RKT?`
  * Fallback Suspense: `Carregando...` ➔ `Carregando login...`
* **Seleção de Contexto (`src/app/login/login-context-selector.tsx`):**
  * Título: `Selecione o Contexto de Atuação` ➔ `Com qual perfil você quer entrar?`
  * Subtítulo: `Identificamos múltiplos vínculos ativos. Escolha por onde deseja atuar nesta sessão:` ➔ `Você tem mais de um vínculo ativo. Escolha como quer entrar agora:`
  * Rótulo de clube: `Vínculo: {ctx.role}` ➔ `{ctx.role} em {ctx.label}`
  * Botão de retorno: `Voltar para login` ➔ `← Voltar`
* **Recuperação de Senha (`src/app/forgot/page.tsx`):**
  * Título: `Recuperar Senha` ➔ `Esqueceu sua senha?`
  * Subtítulo: `Informe seu e-mail ou CPF cadastrado` ➔ `Informe o e-mail ou CPF da sua conta`
  * Placeholder: `WhatsApp ou telefone para contato (opcional)` ➔ `WhatsApp ou telefone (opcional)`
  * Botão submit: `Solicitar Recuperação` ➔ `Enviar link de recuperação`
  * Sucesso título: `Solicitação enviada!` ➔ `Pronto! Verifique seu contato`
  * Sucesso corpo: `Se o usuário existir, a equipe de suporte emitirá o link de redefinição seguro.` ➔ `Se encontrarmos sua conta, você receberá um link para criar uma nova senha em breve.`
  * Botão pós-sucesso: `Voltar ao Login` ➔ `Ir para login`
  * Falha de rede: `Falha de conexão com o servidor` ➔ `Sem conexão. Verifique sua internet e tente novamente.`

### 2. Cadastro (`/signup`)
* **Página de Cadastro (`src/app/signup/page.tsx`):**
  * Título: `Criar Conta no RKT` ➔ `Crie sua conta`
  * Subtítulo: `Preencha os dados para iniciar seu acesso` ➔ `Preencha seus dados para começar`
  * Botão submit (Gestor): `Avançar para Cadastro de Clube` ➔ `Avançar: cadastrar clube`
  * Botão submit (outros): `Cadastrar` ➔ `Criar conta`
  * Botão submit (loading): `Processando...` ➔ `Criando conta...`
  * Link de login: `Já possui conta? Fazer login` ➔ `Já tem conta? Entrar`
  * Validação de termos: `É necessário aceitar os Termos de Uso e Política de Privacidade` ➔ `Aceite os Termos de Uso e a Política de Privacidade para continuar`
* **Campos de Formulário (`src/app/signup/signup-form-fields.tsx`):**
  * Label do perfil: `Perfil principal:` ➔ `Qual é o seu perfil?`
  * Opção de perfil: `Espectador / Responsável` ➔ `Responsável / Espectador`

### 3. Escolha de Área (`src/app/escolher-area/page.tsx`)
* Título: `Escolha sua Área` ➔ `Como você quer entrar?`
* Subtítulo: `Você possui acesso a múltiplos perfis. Selecione o ambiente em que deseja atuar:` ➔ `Você tem mais de um perfil ativo. Escolha com qual quer continuar:`
* Botão (loading): `Acessando...` ➔ `Entrando...`
* Loading inicial da página: `Carregando áreas disponíveis...` ➔ `Carregando seus perfis...`

### 4. Dashboard e Espera de Partida
* **Seção Inicial (`src/app/dashboard/components/dashboard-home-section.tsx`):**
  * Seção suspensas: `Anotações Suspensas` ➔ `Partidas pausadas`
  * Estado vazio: `Nenhuma partida encontrada.` ➔ `Nenhuma partida por aqui ainda.`
* **Aguardando Anotador (`src/app/aguardandoanotador/page.tsx`):**
  * Título: `Aguardando anotador...` ➔ `Aguardando o início da partida`
  * Corpo: `A página será redirecionada automaticamente quando um anotador iniciar a sessão.` ➔ `Você será redirecionado assim que a partida começar.`
  * Timer: `Aguardando há {mm}:{ss}` ➔ `Esperando há {mm}:{ss}`
  * Botão voltar: `Voltar ao dashboard` ➔ `← Voltar`
  * Erro de polling: `Erro ao verificar partida` ➔ `Não foi possível verificar o status. Tentando novamente...`

### 5. Nova Partida (`src/app/match/new/`)
* **Banner de Erro (`MatchNewErrorBanner.tsx`):**
  * Título: `Erro` ➔ `Falta preencher algo`
  * Prefixo de campos: `Falta: {campo}` ➔ `• {campo}`
* **Modal Primeiro Sacador (`components/ServerSelectionModal.tsx`):**
  * Subtítulo: `Selecione o jogador que fará o primeiro saque` ➔ `Toque no jogador que começa sacando`
* **Modal Partida Duplicada (`components/DuplicateMatchModal.tsx`):**
  * ID técnico: `ID: {uuid}` ➔ Colapsar em `<details className="text-xs text-telemetry-text-muted mt-2 cursor-pointer"><summary>Detalhes técnicos</summary>ID: {id}</details>`
  * Botão primário: `Ir para aquela partida` ➔ `Ver partida existente`
  * Botão secundário: `Criar mesmo assim` ➔ `Criar nova mesmo assim`

### 6. Scoring (`src/app/match/[id]/scoring/`)
* **Área de Jogo (`ScoringPlayArea.tsx`):**
  * Banner ponto decisivo: `Ponto Decisivo (No-Ad)` ➔ `Ponto decisivo — No-Ad`
  * Subtítulo de recebedor: `— Quem recebe:` ➔ `Quem recebe agora?`
* **Banner de Partida Finalizada (`scoring-finished-banner.tsx`):**
  * Título: `PARTIDA FINALIZADA!` ➔ `Partida encerrada!`
  * Rótulo de vencedor: `VENCEDOR:` ➔ `Vencedor:`
  * Botão relatório: `📊 Relatório` ➔ `Ver relatório`
  * Botão salvar: `✅ Registrar` ➔ `Salvar e sair`

### 7. Gestor de Clube (`src/app/gestor/`)
* **Abas de Navegação (`tab-nav.tsx`):**
  * `Partidas do Clube` ➔ `Partidas`
  * `Dados do Clube` ➔ `Clube`
* **Cadastro de Membro (`cadastrar-membro-form.tsx` e `cadastrar-membro-modal.tsx`):**
  * Validação inline: `Preencha Nome, CPF e Data de Nascimento.` ➔ `Nome, CPF e data de nascimento são obrigatórios.`
  * Botão submit: `Cadastrar` ➔ `Adicionar Treinador` / `Adicionar Atleta`
  * Botão loading: `Cadastrando...` ➔ `Adicionando...`
* **Vínculo de Membro Existente (`cadastrar-membro-link-prompt.tsx`):**
  * Título: `Usuário já cadastrado no RKT` ➔ `{nome} já tem uma conta no RKT`
  * Corpo Treinador: `O profissional {nome} já possui cadastro na plataforma. Deseja vinculá-lo...` ➔ `{nome} já tem conta no RKT. Quer adicioná-lo como treinador?`
  * Corpo Atleta: `O atleta {nome} já possui cadastro na plataforma. Deseja vincular a conta...` ➔ `{nome} já tem conta no RKT. Quer adicioná-lo ao elenco?`
  * Detalhe: `Ele continuará utilizando sua senha atual...` ➔ `Ele mantém a senha atual e ganha acesso a este clube.`
  * Botão confirmar: `Confirmar Vínculo` ➔ `Sim, vincular`
* **Confirmação Pós-Cadastro (`cadastrar-membro-confirm-modal.tsx`):**
  * Título (vínculo existente): `Vínculo concluído` ➔ `Vínculo feito com sucesso`
  * Corpo (vínculo existente): `{tipo} já possui conta no RKT e foi associado ao clube com sucesso.` ➔ `{nome} já tinha conta no RKT e agora está vinculado ao clube.` *(requer inclusão de `userName` em `CadastroResult`)*
  * Corpo (novo cadastro): `{tipo} cadastrado com sucesso. Compartilhe a senha provisória para o primeiro acesso.` ➔ `Feito! Compartilhe a senha abaixo para o primeiro acesso.`
  * Rótulo de senha: `Senha provisória (DDMMAAAA)` ➔ `Senha temporária` com hint: `Formato: data de nascimento (DDMMAAAA)`
  * Botão: `Fechar e continuar` ➔ `Continuar`
* **Modal de Link de Redefinição (`link-copy-modal.tsx`):**
  * Corpo: `Link gerado para {nome}. Envie este link para o membro cadastrar ou redefinir sua senha:` ➔ `Envie este link para {nome} criar ou redefinir a senha de acesso:`
  * Botão copiar: `Copiar Link` ➔ `Copiar link`
* **Status do Clube (`status-pages.tsx`):**
  * Pendente título: `Clube em Análise` ➔ `Seu clube está em análise`
  * Pendente corpo: `Seu clube ainda está sendo analisado pelo Suporte. Assim que aprovado, você terá acesso ao painel do Gestor.` ➔ `Assim que o suporte aprovar seu clube, você terá acesso completo ao painel.`
  * Pendente rótulo: `Status: Pendente de aprovação` ➔ *(Removido por redundância)*
  * Suspenso título: `Clube Suspenso` ➔ `Acesso suspenso`
  * Suspenso corpo: `O acesso ao seu clube foi suspenso. Entre em contato com o Suporte para mais informações.` ➔ `Seu acesso foi suspenso. Fale com o suporte para saber mais.`

### 8. Padrões Transversais e Tratamento de Exceções
* Erros genéricos em modais: `Erro ao salvar atleta`, `Falha ao cadastrar membro` ➔ `Não foi possível salvar. Tente novamente.`
* Erros de conexão de rede: `Falha de conexão com o servidor` ➔ `Sem conexão. Verifique sua internet e tente novamente.`

---

## 🔍 Matriz de Regressão em Testes

As alterações de texto exigem ajustes simultâneos nos seguintes testes que usam asserções literais:

1. **Dashboard:**
   * `src/app/dashboard/__tests__/DashboardSuspendedSection.test.tsx` (busca por `/Anotações Suspensas/i` ➔ `/Partidas pausadas/i`).
   * `e2e/flows/02-session-resume-ui.spec.ts` (`h3:has-text("Anotações Suspensas")` ➔ `h3:has-text("Partidas pausadas")`).
2. **Escolha de Área:**
   * `src/app/escolher-area/__tests__/page.test.tsx` (`getByText('Escolha sua Área')` ➔ `getByText('Como você quer entrar?')`).
3. **Gestor de Clube:**
   * `src/app/gestor/__tests__/tab-nav.test.tsx` (botões `/Partidas do Clube/i` e `/Dados do Clube/i` ➔ `/Partidas/i` e `/Clube/i`).
   * `src/app/gestor/__tests__/cadastrar-membro-modal-link.test.tsx` (`findByText('Vínculo concluído')` ➔ `findByText('Vínculo feito com sucesso')`).
   * `src/app/gestor/__tests__/cadastrar-membro-modal.test.tsx` (botão `Cadastrar` e mensagens de erro).
4. **Cadastro:**
   * `src/app/signup/__tests__/page.test.tsx` (botão `/Avançar para Cadastro de Clube/i` ➔ `/Avançar: cadastrar clube/i`).
5. **Scoring:**
   * `src/app/match/[id]/scoring/__tests__/scoring.page.characterization.test.tsx` (`getByText("PARTIDA FINALIZADA!")` ➔ `getByText("Partida encerrada!")`).
   * `src/app/match/new/components/__tests__/ServerSelectionModal.test.tsx` (asserção do subtítulo do saque).

---

## 🚀 Fases de Execução (Baby Steps)

1. **Fase 1 — Autenticação e Onboarding:**
   * Implementar alterações em `/login`, `/forgot`, `/signup` e `/escolher-area`.
   * Atualizar `src/app/signup/__tests__/page.test.tsx` e `src/app/escolher-area/__tests__/page.test.tsx`.
   * Rodar `pnpm test:components`.
2. **Fase 2 — Dashboard e Espera de Partida:**
   * Implementar alterações em `dashboard-home-section.tsx` e `/aguardandoanotador/page.tsx`.
   * Atualizar `DashboardSuspendedSection.test.tsx` e `02-session-resume-ui.spec.ts`.
   * Rodar testes unitários do dashboard.
3. **Fase 3 — Criação de Partida e Scoring:**
   * Alterar `MatchNewErrorBanner.tsx`, `ServerSelectionModal.tsx`, `DuplicateMatchModal.tsx`.
   * Alterar `ScoringPlayArea.tsx` e `scoring-finished-banner.tsx`.
   * Atualizar `scoring.page.characterization.test.tsx` e `ServerSelectionModal.test.tsx`.
   * Rodar `pnpm test:design`.
4. **Fase 4 — Módulo Gestor de Clube:**
   * Estender `CadastroResult` com `userName?: string` para interpolação limpa do nome.
   * Alterar `tab-nav.tsx`, modais de cadastro/vínculo/link e `status-pages.tsx`.
   * Atualizar `tab-nav.test.tsx`, `cadastrar-membro-modal.test.tsx` e `cadastrar-membro-modal-link.test.tsx`.
   * Rodar testes unitários do gestor.
5. **Fase 5 — Padronização Transversal & Validação Final:**
   * Atualizar mensagens genéricas de erro de rede e formulários restantes.
   * Padronizar Sentence case em botões restantes.
   * Executar validação completa:
     * `pnpm typecheck`
     * `pnpm test:design`
     * `pnpm test:strict`

