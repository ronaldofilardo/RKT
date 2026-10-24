# Frontend & UI Component Standards

## Diretrizes de Interface
1. **Design System & Tokens**:
   - Usar classes utilitárias do Tailwind e variáveis semânticas (ex: `bg-background`, `text-foreground`, `border-border`).
   - Evitar cores cruas arbitrárias sem harmonização (`bg-red-500` sem contexto de erro/destaque).
2. **Acessibilidade e Micro-interações**:
   - Estados visuais claros para `:hover`, `:focus-visible`, `:disabled` e `aria-*`.
   - Transições suaves (`transition-colors duration-200`).
3. **Componentes Atômicos e Reutilizáveis**:
   - Integrar componentes Shadcn/UI em `@/components/ui`.
   - Componentes de domínio de negócio ficam em `@/components/<dominio>`.
