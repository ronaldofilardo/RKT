# API & Response Format Standards

## Estrutura Padronizada de Resposta JSON
Todas as rotas de API devem seguir o envelope unificado:

```typescript
// Sucesso
{
  "success": true,
  "data": T,
  "message"?: string
}

// Erro
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR",
    "message": string,
    "details"?: unknown
  }
}
```

## Status HTTP
- `200 OK`: Consulta ou mutação concluída com retorno.
- `201 Created`: Recurso criado com sucesso.
- `400 Bad Request`: Falha de validação ou payload inválido.
- `401 Unauthorized`: Ausência de token/sessão válida.
- `403 Forbidden`: Usuário autenticado sem permissão para o recurso.
- `404 Not Found`: Recurso não localizado.
- `500 Internal Error`: Falha inesperada tratada pelo servidor.
