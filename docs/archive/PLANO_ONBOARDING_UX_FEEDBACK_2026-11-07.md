# PLANO DETALHADO — ONBOARDING, UX E FEEDBACK (RKT)

> **Data de Criação:** 2026-11-07  
> **Status:** Pronto para Execução / Aprovado  
> **Escopo:** Atleta (`ATHLETE`), Treinador (`COACH` - Clube e Avulso), Gestor de CT (`MANAGER`) e Espectador (`SPECTATOR`).  
> **Exceção de Escopo:** Administrador (`ADMIN`).  
> **Premissa:** Clube nasce aprovado/ativo no fluxo atual (sem tela de espera PENDING).

---

## 1. Visão Geral da Arquitetura da Solução

```
[Primeiro Acesso / Login]
       │
       ▼
   mustChangePassword? ─── Sim ───► /trocar-senha (validação inline + escape hatch)
       │                                     │
       Não                                   ▼ (sucesso /login?from=reset)
       │                              Redireciona para login / onboarding
       ▼                                     │
   Verificação de Onboarding (localStorage)  │
   rkt_onboarded_<userId> existe?            │
       │                                     ▼
       ├─── Não ───────────────────► Rota /onboarding (Stepper leve por Perfil)
       │                                     │ (Concluir ou Pular)
       │                                     ▼
       └─── Sim ───────────────────► Dashboard Contextualizado
                                             │
                                             ▼
                                  Empty State com CTAs Reais
                                  (Atleta, Treinador, Gestor, Espectador)
```

---

## 2. Frente 1: Refatoração do Sistema de Feedback e Notificações (Toast)

### 2.1. Diagnóstico Técnico Atual
- `src/components/Toast.tsx` possui apenas os tipos `'success' | 'error' | 'info'`.
- Tempo fixo de 5 segundos via `setTimeout`, sem suporte a persistência (`persistent`).
- Ausência de fila de desduplicação (toasts idênticos gerados em loop de offline/retry empilham visualmente).
- Posicionamento fixo `top-4 right-4`, que colide diretamente com o menu hambúrguer e a barra de navegação no mobile.
- Falta de suporte para ações interativas (`action?: { label: string; onClick: () => void }`).

### 2.2. Especificação Técnica
1. **Contratos & Tipos (`src/components/toast-types.ts`):**
   ```ts
   export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

   export interface ToastAction {
     label: string;
     onClick: () => void;
   }

   export interface ToastOptions {
     type: ToastType;
     message: string;
     key?: string;            // Para desduplicação
     persistent?: boolean;    // Para erros críticos (não fecha sozinho)
     action?: ToastAction;    // Ação inline (ex: "Tentar novamente")
     durationMs?: number;     // Customizável (padrão 5000ms, ignorado se persistent/loading)
   }

   export interface ToastMessage extends ToastOptions {
     id: string;
   }
   ```
2. **Componente Visual & Posicionamento Responsivo:**
   - **Mobile:** `bottom-4 inset-x-4 flex-col items-center` (visível, ergonômico, não bloqueia o topo nem botões de anotação).
   - **Desktop:** `sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto`.
   - Adicionar estado `loading` com spinner SVG inline.
   - Adicionar botão de ação e botão de fechar (`✕`) acessível com `aria-label="Fechar notificação"`.
3. **Desduplicação por `key`:** Se uma notificação com a mesma `key` for disparada, o temporizador anterior é cancelado e o conteúdo é atualizado, evitando "chuva de toasts" no modo offline.

---

## 3. Frente 2: Validação Inline e UX de Formulários

### 3.1. Tela de Login (`/login`)
- **Humanização dos Códigos de Erro (`use-login-form.ts`):**
  - Mapear `USER_NOT_FOUND` $\rightarrow$ *"Não encontramos uma conta com este e-mail ou CPF."*
  - Mapear `INVALID_PASSWORD` $\rightarrow$ *"Senha incorreta. Verifique os dados digitados."*
  - Mapear erros de rede / 500 $\rightarrow$ *"Serviço temporariamente indisponível. Verifique sua conexão."*
- **Banner de Transição de Senha Provisória:**
  - Quando a API responder com `mustChangePassword: true`, renderizar um banner de alerta (`telemetry-warning`) por 1,5s antes do redirecionamento: *"Sua senha é provisória. Redirecionando para definir uma senha definitiva..."*.

### 3.2. Tela de Cadastro Geral (`/signup`)
- **Nome Completo:** Validação em tempo real no `onBlur` (mínimo 2 palavras, regex sem dígitos).
- **Detecção Híbrida E-mail vs. CPF:**
  - O campo detecta `@` ou padrão numérico.
  - Para CPF: formatação de máscara progressiva e validação do dígito verificador via validador existente `isValidCpf`. Feedback com ícone `✓` verde ou `✕` vermelho e mensagem inline.
- **Indicador de Força de Senha (`src/components/ui/password-strength-meter.tsx`):**
  - Barra de 3 segmentos coloridos:
    - *Fraca* (< 8 caracteres)
    - *Média* (8+ caracteres, apenas letras ou números)
    - *Forte* (8+ caracteres, combinando letras, números e caracteres especiais)
- **Eliminação do Bloco Vermelho Genérico:**
  - Erros de campos individuais migram exclusivamente para legendas acessíveis logo abaixo de cada input (`aria-describedby`).
  - O alerta superior fica reservado estritamente para erros globais da API (ex: *"Este e-mail/CPF já está em uso"*).

### 3.3. Troca de Senha Provisória (`/trocar-senha`)
- **Validação Cruzada em Tempo Real:**
  - O campo "Confirmar nova senha" compara imediatamente com "Nova senha" em `onChange`/`onBlur`, sem esperar o clique no botão Salvar.
  - Exibição de texto explicativo inline: *"As senhas não coincidem"*.

### 3.4. Modal de Cadastro de Gestor (`gestor-onboarding-modal.tsx`)
- Adicionar barra de progresso no topo: 50% na Etapa 1 (Dados do Clube) e 100% na Etapa 2 (Dados do Gestor).
- Validação inline `onBlur` com feedback em tempo real para CNPJ, CEP e Telefone, mantendo a validação estrutural final de submit.

---

## 4. Frente 3: Empty States Contextuais com CTAs Diretos

Substituição da linha estática `"Nenhuma partida por aqui ainda."` em `dashboard-home-section.tsx` por um componente inteligente `src/app/dashboard/components/dashboard-empty-state.tsx`:

```
┌─────────────────────────────────────────────────────────────┐
│                       [Ícone do Perfil]                     │
│               Título Personalizado (ex: Bem-vindo)          │
│         Mensagem de apoio com benefícios da telemetria      │
│                                                             │
│   [ CTA Principal: + Ação ]     [ CTA Secundário Opcional ] │
│                                                             │
│         💡 Dica rápida sobre o próximo passo ideal          │
└─────────────────────────────────────────────────────────────┘
```

### 4.1. Especificação dos Empty States por Perfil

1. **Atleta (`ATHLETE`):**
   - **Título:** *"Bem-vindo à sua central de telemetria"*
   - **Descrição:** *"Você ainda não possui partidas registradas no seu histórico."*
   - **CTA Principal:** `[ + Criar Minha Primeira Partida ]` $\rightarrow$ navega para `/match/new`.
   - **Dica:** *"Ao registrar seus jogos, o RKT calcula automaticamente seu índice de pressão, saque e momentum."*

2. **Treinador (`COACH` - Clube ou Avulso):**
   - **Título:** *"Pronto para iniciar os treinos e anotações?"*
   - **Descrição:** *"Nenhuma partida em andamento ou registrada para os seus atletas."*
   - **CTAs:**
     - `[ + Nova Partida ]` $\rightarrow$ `/match/new`
     - `[ Cadastrar Atleta ]` $\rightarrow$ `/atletas`
   - **Dica:** *"Vincule seus atletas para acompanhar a evolução técnica e relatórios comparativos."*

3. **Gestor de CT (`MANAGER`):**
   - **Título:** *"Seu Centro de Treinamento está pronto"*
   - **Descrição:** *"Seu clube já está ativo. Comece estruturando sua comissão técnica e seus jogadores."*
   - **CTAs:**
     - `[ + Cadastrar Treinadores ]` $\rightarrow$ `/gestor` (foco na aba treinadores)
     - `[ + Cadastrar Atletas ]` $\rightarrow$ `/gestor` (foco na aba atletas)
   - **Dica:** *"Gere links com senha provisória de 7 dias para que sua equipe acesse o sistema rapidamente."*

4. **Espectador / Pais (`SPECTATOR`):**
   - **Título:** *"Acompanhe seus jogos favoritos"*
   - **Descrição:** *"Você ainda não criou nem acompanha nenhuma partida ativa."*
   - **CTA Principal:** `[ + Anotar uma Partida ]` $\rightarrow$ `/match/new`
   - **Dica:** *"Você também pode solicitar o link de transmissão de uma partida ao vivo para assistir aos pontos em tempo real."*

---

## 5. Frente 4: Módulo de Onboarding Guiado (`/onboarding`)

### 5.1. Fluxo e Gatilho
- **Rota:** `src/app/onboarding/page.tsx`.
- **Persistência de Estado:** Chave `rkt_onboarded_${userId}` gravada em `localStorage` (evita migração de banco e chamadas extras de API).
- **Gatilho de Entrada:**
  1. No redirecionamento pós-login (ou após saída de `/trocar-senha`), verificar a presença da flag local.
  2. Se a flag não existir, redirecionar para `/onboarding`.
  3. Ao concluir ou clicar em **"Pular Introdução"**, a flag é persistida e o usuário é enviado ao seu dashboard padrão.

### 5.2. Conteúdo do Stepper por Perfil (3 etapas rápidas):

| Perfil | Passo 1 (Boas-vindas) | Passo 2 (Funcionalidade Chave) | Passo 3 (Próxima Ação) |
|---|---|---|---|
| **Atleta** | O que é o RKT e telemetria de tênis | Como ler seus gráficos de momentum e saque | Crie ou busque sua primeira partida |
| **Treinador** | Visão geral da gestão da sua equipe | Como cadastrar atletas e organizar categorias | Iniciar uma anotação de treino ou torneio |
| **Gestor** | Visão do painel executivo do seu CT | Gestão de licenças, treinadores e atletas | Enviar os primeiros convites para sua equipe |
| **Espectador** | Acompanhamento e placar ao vivo | Como funciona o placar ponto a ponto | Iniciar sua primeira anotação avulsa |

---

## 6. Frente 5: Melhorias de Feedback do Gestor na Gestão de Membros

1. **Botão "Copiar Link de Senha":**
   - No modal `CadastrarMembroLinkPrompt`, adicionar botão de cópia de clique único (`navigator.clipboard.writeText`) com feedback visual: troca do ícone para check e texto *"Copiado!"* por 2 segundos.
2. **Exibição Explícita da Expiração:**
   - Exibir com clareza o prazo legal do link: *"Este link expira em 7 dias (válido até DD/MM/AAAA às HH:mm)"*.
3. **Confirmação de Ações na Tabela:**
   - Toast de sucesso ao salvar edições de atletas ou treinadores.
   - Toast informativo ao alternar a permissão *"Inserir Atletas"* de um treinador (*"Permissão ativada"* / *"Permissão desativada"*).

---

## 7. Cronograma e Fases de Execução

| Sprint | Frentes | Entregáveis Principais | Dependências |
|---|---|---|---|
| **Sprint 1** | Frentes 1, 3 e 5 | • `Toast.tsx` robusto (`warning`, `loading`, mobile ergonômico)<br>• Empty States contextuais por perfil no Dashboard<br>• Botão copiar link e toasts de feedback na área do Gestor | Nenhuma |
| **Sprint 2** | Frente 2 | • Validação `onBlur` com feedback inline em `/signup` e `/login`<br>• Indicador visual de força de senha (`password-strength-meter`)<br>• Validação em tempo real de confirmação de senha em `/trocar-senha` | Nenhuma |
| **Sprint 3** | Frente 4 | • Rota modular `/onboarding` com cards e stepper por perfil<br>• Integração do gatilho pós-primeiro-login com escape hatch<br>• Testes E2E (Playwright) e testes unitários de regressão | Sprints 1 e 2 |

