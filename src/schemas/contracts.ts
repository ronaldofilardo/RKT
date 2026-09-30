/**
 * Schemas e contratos de domínio particionados.
 * Este arquivo reexporta todos os tipos e esquemas Zod a partir de seus
 * respectivos módulos de domínio em src/schemas/:
 * - common.ts: validadores utilitários (flexibleIdValidator)
 * - rally.ts: esquemas de rally, golpes e pontuação
 * - user.ts: esquemas de usuário, papéis e autenticação
 * - player.ts: esquemas de atletas e rankings
 * - match.ts: esquemas de partida, placar e mutações de partida
 * - annotation.ts: esquemas de sessão de anotação e auditoria
 */

export * from "./common";
export * from "./rally";
export * from "./user";
export * from "./player";
export * from "./match";
export * from "./annotation";
