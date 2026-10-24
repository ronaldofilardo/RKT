# Database & Prisma Standards

## Modelagem e Acesso a Dados
1. **Convenções de Nomenclatura**:
   - Tabelas/Models em PascalCase (`User`, `WorkspaceMember`).
   - Campos em camelCase no schema e snake_case no banco relacional via `@map("created_at")`.
2. **Migrations e Seeds**:
   - Nunca alterar banco em produção sem migration versionada.
   - Sempre executar `rtk pnpm prisma format` e `rtk pnpm prisma validate` após editar `schema.prisma`.
3. **Consultas Otimizadas**:
   - Usar `select` explícito para carregar somente os campos necessários, evitando `select *` em entidades grandes.
