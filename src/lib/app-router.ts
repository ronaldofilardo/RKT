import type { useRouter } from "next/navigation";

/**
 * O App Router tipa `push`/`replace` com `RouteImpl<string>` (rotas tipadas),
 * mas aceitamos qualquer string construída em runtime — inclusive rotas
 * dinâmicas montadas com template literals. Derivamos do retorno real de
 * `useRouter`, não do contexto `AppRouterInstance` (que alarga para `string`).
 */
export type AppRouteInput = Parameters<ReturnType<typeof useRouter>["push"]>[0];
