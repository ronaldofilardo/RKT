# Matriz de Segurança — RBAC + Multi-tenancy

## Roles
| Role       | Nível | Permissões                                    |
|------------|-------|-----------------------------------------------|
| ADMIN      | 5     | Tudo                                           |
| GESTOR     | 4     | CRUD de partidas, atletas, configurações      |
| COACH      | 3     | Anotação tática, registrar pontos             |
| ATHLETE    | 2     | Ver próprias partidas e estatísticas          |
| SPECTATOR  | 1     | Leitura pública (rankings, resultados)        |

## Autenticação
- JWT validado no Edge (Next.js Middleware)
- Token no header `Authorization: Bearer <token>`
- Expiração: 2h (access token), 7d (refresh token)
