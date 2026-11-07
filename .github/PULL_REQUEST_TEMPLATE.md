# Pull Request Template

## Descrição
<!-- Descreva brevemente as mudanças deste PR -->

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Refatoração (mudança que não corrige bug nem adiciona feature)
- [ ] Documentação
- [ ] Chore (build, CI, configs, etc.)

## Checklist de Qualidade

### Código
- [ ] **Arquivos alterados ≤ 100 linhas** (R-03)
- [ ] `pnpm typecheck` passa sem erros
- [ ] `pnpm lint` passa sem warnings/errors
- [ ] `pnpm check:r03` passa (ratchet R-03)
- [ ] Testes das suítes afetadas passam (`pnpm test -- --testPathPattern="..."`)
- [ ] Se toca UI: `pnpm test:design` passa

### Testes
- [ ] Testes de caracterização para código legado tocado
- [ ] Testes de regressão para bugs corrigidos
- [ ] Cobertura mantida ou aumentada

### Arquitetura (STE-DEV)
- [ ] R-04: UI puramente declarativa (zero I/O em componentes)
- [ ] R-05: Domínio puro isolado (zero framework/I/O)
- [ ] R-06: Tipagem rigorosa nas bordas (sem `any` em interfaces públicas)
- [ ] R-07: Validação Zod nas bordas de API
- [ ] R-13: Acessibilidade (labels, aria-*, focus-visible)

### Documentação
- [ ] `docs/ste-dev.md` atualizado se houver decisão arquitetural
- [ ] `docs/glossario.md` atualizado se houver novo termo canônico
- [ ] ADR registrado se decisão significativa

## Evidências
- [ ] Screenshots/GIFs para mudanças de UI
- [ ] Output dos comandos de verificação (`typecheck`, `lint`, `check:r03`, `test`)

## Contexto Adicional
<!-- Links para issues, decisões, discussões relacionadas -->