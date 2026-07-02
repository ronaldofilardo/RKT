# Política de Refatoração

## 1. Princípios Gerais

- **Baby Steps**: Mudanças pequenas e incrementais, testadas a cada passo.
- **Zero Débitos Acumulados**: Dívidas técnicas devem ser pagas no mesmo sprint ou priorizadas no backlog.
- **Coesão Alta, Acoplamento Baixo**: Cada módulo/arquivo tem responsabilidade única e bem definida.
- **Regra do Escotismo**: "Deixe o código mais limpo do que encontrou."

---

## 2. Limite de Tamanho de Arquivos

| Métrica | Limite |
|---------|--------|
| Linhas por arquivo | **máximo 500** |

Se um arquivo atingir 400+ linhas, deve-se avaliar a divisão.

**Estratégias de Divisão:**
- Extrair classes/modules auxiliares para arquivos separados.
- Separar lógica de negócio da infraestrutura (ex: `UserService.ts` vs `UserRepository.ts`).
- Quebrar componentes grandes em subcomponentes.
- Criar arquivos utilitários para funções compartilhadas.

---

## 3. Quando Refatorar

| Gatilho | Ação |
|---------|------|
| Método/função com +30 linhas | Avaliar extração |
| Arquivo com +350 linhas | Planejar divisão |
| Código duplicado em 2+ lugares | Extrair para função comum |
| Nomenclatura ambígua/confusa | Renomear imediatamente |
| Comentários explicando "o quê faz" | Substituir por código expressivo |
| Dependência circular | Refatorar arquitetura |
| Complexidade ciclomática > 10 | Simplificar lógica |

---

## 4. Checklist Antes de Refatorar

```
[ ] Testes existentes passando
[ ] Escopo da refatoração definido
[ ] Plano de etapas documentado
[ ] Backups versionados (git)
[ ] CI/CD monitors disponíveis
[ ] Revisor/peer identificado
```

---

## 5. Fluxo de Refatoração

```
1. IDENTIFICAR   → Encontrar código que precisa de melhoria
2. MEDIR         → Quantificar o problema (linhas, complexidade, duplicação)
3. TESTAR        → Garantir que há testes cobrindo o código
4. REFATORAR     → Aplicar mudança mínima necessária
5. VERIFICAR     → Testes ainda passando
6. COMITAR       → Com mensagem semântica: "refactor: [o quê]"
```

---

## 6. Boas Práticas de Código

### 6.1 Nomenclatura
```typescript
// ❌ Ruim
function calc(x, y) { ... }
const data = getUser();

// ✅ Bom
function calculateDiscount(unitPrice: number, quantity: number): number { ... }
const userProfile = getUserById(userId: string): User;
```

### 6.2 Funções
```typescript
// ❌ Ruim - faz múltiplas coisas
function processOrder(order) {
  validateOrder(order);
  calculateTotal(order);
  saveToDatabase(order);
  sendEmail(order);
}

// ✅ Bom - responsabilidade única
function validateOrder(order: Order): void { ... }
function calculateOrderTotal(order: Order): number { ... }
async function persistOrder(order: Order): Promise<void> { ... }
async function notifyCustomer(order: Order): Promise<void> { ... }
```

### 6.3 Estrutura de Arquivos (exemplo)
```
src/
├── modules/
│   └── orders/
│       ├── orders.controller.ts      # HTTP layer (max 100 linhas)
│       ├── orders.service.ts         # Lógica de negócio (max 300 linhas)
│       ├── orders.repository.ts      # Acesso a dados (max 200 linhas)
│       ├── orders.types.ts           # Types/interfaces (max 150 linhas)
│       ├── orders.errors.ts          # Erros customizados (max 100 linhas)
│       └── orders.utils.ts           # Funções auxiliares (max 150 linhas)
```

---

## 7. Divisão de Arquivos Grandes

### Sintomas de arquivo grande:
- 400-500 linhas
- Múltiplos responsáveis (git blame diversificado)
- Dificuldade de encontrar código relevante
- Testes difíceis de escrever

### Como dividir:

| Tipo de Código | Arquivo Destino |
|----------------|-----------------|
| Lógica de negócio | `*.service.ts` |
| Acesso a dados | `*.repository.ts` |
| Validações | `*.validator.ts` |
| Types/Interfaces | `*.types.ts` |
| Constantes | `*.constants.ts` |
| Helpers/Utilitários | `*.utils.ts` |
| Mapeamentos | `*.mappers.ts` |

---

## 8. Critérios de Aprovação de PR com Refatoração

- [ ] Sem aumento de complexidade acidental
- [ ] Linhas por arquivo ≤ 500
- [ ] Funções/métodos ≤ 30 linhas (idealmente ≤ 15)
- [ ] Nenhum novo code smell detectado (SonarQube/ESLint)
- [ ] Cobertura de testes mantida ou aumentada
- [ ] Revisão aprovada por pelo menos 1 peer

---

## 9. Anti-Patterns Proibidos

| Anti-Pattern | Solução |
|-------------|---------|
| God Class/Object | Dividir em classes menores |
| Shotgun Surgery | Consolidadar mudanças related |
| Divergent Change | Extrair responsabilidades |
| Spaghetti Code | Reescrever com estrutura clara |
| Magic Numbers | Extrair para constantes nomeadas |
| Deep Nesting (>3 níveis) | Early returns, extrair métodos |

---

## 10. Ferramentas Recomendadas

| Finalidade | Ferramenta |
|-----------|------------|
| Análise estática | ESLint, SonarQube, Pylint |
| Métricas de código | CodeClimate, CodeScene |
| Cobertura de testes | Jest coverage, Istanbul |
| Duplicação de código | Duplica, Jscpd |
| Complexidade | esComplex, radon |

---

## 11. Métricas e Monitoramento

| Métrica | Target |
|---------|--------|
| Linhas por arquivo | ≤ 500 (crítico: ≤ 400) |
| Linhas por função | ≤ 30 (ideal: ≤ 15) |
| Complexidade ciclomática | ≤ 10 |
| Cobertura de código | ≥ 80% |
| Débito técnico | ≤ 5 issues de alta severidade |

---

> **Nota**: Qualquer refatoração que não melhore o código deve ser revertida. O objetivo é legibilidade e manutenibilidade, não apenas "código novo".