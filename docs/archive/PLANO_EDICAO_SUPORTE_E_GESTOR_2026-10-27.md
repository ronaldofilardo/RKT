# Plano de Implementação: Edição de Clubes, Gestores, Dados do CT e Gestão de Treinadores e Atletas

**Data:** 27/10/2026  
**Status:** Planejado para Execução  
**Documentos de Referência:** `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/DESIGN.md`, `docs/PLANO_GESTOR_CLUBE_E_SUPORTE_2026-10-26.md`

---

## 1. Visão Geral e Escopo

Este plano detalha a implementação das funcionalidades pendentes nos painéis do **Suporte (`/suporte`)** e do **Gestor (`/gestor`)**, divididas em quatro frentes prioritárias:

1. **`/suporte` > Aba "Clubes e CTs" (Ativos):** Botão na linha de cada clube/CT ativo para abrir o modal de edição de dados cadastrais.
2. **`/suporte` > Aba "Gestores" ("Gestão de Gestores"):** Botão na linha de cada usuário gestor para abrir o modal de edição de dados cadastrais/permissões, corrigindo o bloqueio de autorização do Suporte (`platform:users:manage`) e os bugs de montagem/reatividade do formulário.
3. **`/gestor` > "Dados do Clube":** Apresentação completa e fidedigna dos dados da Pessoa Jurídica e do Representante Legal coletados no momento do cadastro, com modal de edição funcional e trava estrita de imutabilidade no CNPJ.
4. **`/gestor` > "Treinadores e Atletas":** Modal/botão de cadastro unificado com os campos: Nome completo, CPF, Data de Nascimento e Seletor de Tipo (Treinador ou Atleta). Nas tabelas de listagem: botão de edição individual e controle de seleção por linha.

---

## 2. Fase 1: Suporte — Edição de Clubes e CTs Ativos

### 2.1 Backend: Ajustes de Projeção e Validação
- **Arquivo:** `src/app/api/training-centers/route.ts` (`GET`)
  - Expor a projeção completa dos dados cadastrais quando o requisitante for `PLATAFORMA` (`ADMIN`/`SUPORTE`) ou Gestor do próprio CT:
    - `cnpj`, `legalName`, `phone`, `email`, `address`, `legalRepName`, `legalRepEmail`, `legalRepPhone`.
- **Arquivo:** `src/app/api/training-centers/[id]/route.ts` (`PATCH`)
  - Flexibilizar o schema Zod `ClubDataSchema` tornando o objeto `address` opcional para permitir a atualização isolada dos dados de contato, razão social e representante legal sem exigir o payload completo de endereço quando este não for alterado.

### 2.2 Frontend: Conexão do Modal e Ações
- **Arquivo:** `src/app/suporte/clubes-section.tsx`
  - No filtro de status ou para clubes com `status === 'ACTIVE'`, exibir o botão **"Editar"** ativo.
  - Adicionar prop `onEditClub: (ct: TrainingCenter) => void`.
- **Arquivo:** `src/app/suporte/suporte-page-content.tsx`
  - Controlar o estado do modal: `editClubOpen: boolean` e `selectedClub: TrainingCenter | null`.
  - Importar e renderizar `EditarClubeModal` com `key={selectedClub?.id}` condicionado a `editClubOpen && selectedClub`.
  - Implementar `handleEditClub(ctId: string, data: any)` realizando chamada `PATCH /api/training-centers/${ctId}` com feedback de sucesso/erro e recarregamento via `onRetry()`.

---

## 3. Fase 2: Suporte — Edição de Gestores e Remediação RBAC

### 3.1 Correção de Permissões (RBAC)
- **Arquivo:** `src/core/access/profile-matrix.ts`
  - Conceder ao perfil `SUPORTE` a permissão `'platform:users:manage'` com escopo restrito a usuários da plataforma (`['P']` ou `['NON_PLATFORM_TARGET']`), permitindo que a equipe de suporte liste (`GET /api/users`) e edite gestores (`PATCH /api/users/[id]`).
- **Arquivo:** `src/app/api/users/[id]/route.ts`
  - Garantir que a auditoria (`AuditLog`) registre formalmente a ação `GESTOR_DADOS_ATUALIZADOS_SUPORTE`.

### 3.2 Correção de Interface e Reatividade
- **Arquivo:** `src/app/suporte/gestores-section.tsx`
  - Corrigir a instanciação do modal: renderizar `<EditarGestorModal ... />` somente quando `editOpen && editingUser !== null`.
  - Passar `key={editingUser.id}` para garantir que o formulário reinicialize seus estados internos sempre que um novo gestor for selecionado.
- **Arquivo:** `src/app/suporte/editar-gestor-modal.tsx`
  - Adicionar sincronização via `useEffect` ou controle via `key` para atualizar os campos `formData` quando a propriedade `user` for alterada.

---

## 4. Fase 3: Gestor — Exibição e Edição de Dados do Clube

### 4.1 Endpoints Dedicados para o Gestor
- **Arquivo:** `src/app/api/gestor/club/route.ts` (Novo)
  - `GET`: Retorna os dados completos do CT vinculado ao gestor logado (`select: id, name, slug, cnpj, legalName, phone, email, address, legalRepName, legalRepCpf, legalRepEmail, legalRepPhone, status`).
  - `PATCH`: Permite atualizar Razão Social, Nome Fantasia, Telefone institucional, E-mail institucional e dados de Representante Legal.
  - **Trava de Segurança:** Rejeitar expressamente qualquer tentativa de modificação no campo `cnpj` (imutabilidade garantida em backend).
  - Escopo validado via `withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }))`.

### 4.2 Interface de Visualização e Modal
- **Arquivo:** `src/app/gestor/club-info.tsx`
  - Reformular o componente para buscar os dados de `/api/gestor/club` ou recebê-los do dashboard.
  - Renderizar blocos organizados:
    1. **Dados Institucionais:** Nome Fantasia, Razão Social, CNPJ (com badge "Não editável"), Telefone, E-mail Institucional.
    2. **Endereço do CT:** Rua, Número, Complemento, Bairro, Cidade, Estado, CEP.
    3. **Representante Legal:** Nome Completo, CPF, Telefone, E-mail.
  - Conectar o botão **"Editar dados do clube"** ao modal `EditarClubeModalGestor`.
- **Arquivo:** `src/app/gestor/editar-clube-modal-gestor.tsx`
  - Conectar o envio ao endpoint `PATCH /api/gestor/club`, exibindo feedback de loading e sucesso.

---

## 5. Fase 4: Gestor — Cadastro Unificado, Edição e Seleção de Treinadores e Atletas

### 5.1 Modal de Cadastro Unificado
- **Arquivo:** `src/app/gestor/cadastrar-membro-modal.tsx` (Novo)
  - Modal com formulário simplificado contendo:
    1. **Nome completo** (texto)
    2. **CPF** (com máscara `000.000.000-00` e validação)
    3. **Data de Nascimento** (`DD/MM/AAAA` ou date input)
    4. **Tipo / Perfil:** Seletor (Radio/Cards) entre **Treinador** e **Atleta**
    5. *Campos contextuais automáticos:*
       - Se Treinador: campo de **E-mail** (necessário para emissão do link de acesso inicial).
       - Se Atleta: E-mail opcional, com seleção padrão para Gênero e Lateralidade (editáveis).
  - No submit:
    - Se Treinador $\rightarrow$ chama `POST /api/gestor/coaches`.
    - Se Atleta $\rightarrow$ chama `POST /api/gestor/athletes`.
  - Exibe modal de confirmação com a senha provisória gerada (`DDMMAAAA`) e link de primeiro acesso para envio rápido.

### 5.2 Edição e Seleção nas Tabelas de Treinadores e Atletas
- **Endpoints de Edição:**
  - `PATCH /api/gestor/coaches/[id]/route.ts` (Novo): Atualiza dados do treinador (Nome, E-mail, Telefone/Vínculo) escopado ao `ctId` do gestor.
  - `PATCH /api/gestor/athletes/[id]/route.ts` (Novo): Atualiza dados do atleta (Nome, Gênero, Lateralidade, Data de Nascimento) escopado ao `ctId` do gestor.
- **Tabela de Treinadores (`coaches-table.tsx`):**
  - Adicionar checkbox de seleção em cada linha e no cabeçalho ("Selecionar todos").
  - Adicionar botão **"Cadastrar Treinador/Atleta"** no topo da tela.
  - Conectar o botão **"Editar"** de cada linha ao modal `EditarTreinadorModal`.
- **Tabela de Atletas (`athletes-table.tsx`):**
  - Adicionar checkbox de seleção em cada linha e no cabeçalho.
  - Adicionar botão **"Cadastrar Treinador/Atleta"** no topo.
  - Conectar o botão **"Editar"** de cada linha ao modal `EditarAtletaModal`.

---

## 6. Diretrizes Técnicas e Regras R03

1. **Limite R03 (< 100 linhas por arquivo):**
   - Modais, tabelas e formulários devem ser desacoplados em subcomponentes puros quando o arquivo atingir o limiar de tamanho.
   - Rotas de API finas delegando para funções puras em `*.logic.ts`.
2. **Gerenciamento de Pacotes:**
   - Proibido uso de `npm`. Utilizar unicamente `pnpm` ou `npx`.
3. **Auditoria:**
   - Registrar no `AuditLog` toda e qualquer alteração cadastral realizada pelo Suporte ou pelo Gestor.

---

## 7. Roteiro de Testes e Validação

1. **Testes Unitários:**
   - Validação da imutabilidade do CNPJ nas mutações de clube.
   - Validação de autorização na matriz RBAC para perfil `SUPORTE` em `platform:users:manage`.
2. **Testes de Integração de API (Jest):**
   - `PATCH /api/training-centers/[id]`: Atualização pelo Suporte com sucesso.
   - `GET` e `PATCH /api/gestor/club`: Validação de isolamento do tenant e trava de CNPJ.
   - `PATCH /api/gestor/coaches/[id]` e `PATCH /api/gestor/athletes/[id]`.
3. **Validação E2E (Interface):**
   - Suporte acessa `/suporte`, clica em Editar no clube ativo e salva com sucesso.
   - Suporte edita dados do Gestor sem erros no console.
   - Gestor visualiza os dados completos do seu clube em `/gestor` e altera Razão Social/Contato.
   - Gestor cadastra novo Treinador e novo Atleta usando o formulário unificado, seleciona linhas na tabela e edita seus dados.
