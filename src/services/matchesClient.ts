import type { TimelinePoint } from "@/core/scoring/types";
import { createMatchEndpoints, createReportEndpoints } from "./matches-client-endpoints.logic";
import { UnauthorizedError } from "./matches-client-request.logic";

/**
 * Cliente HTTP das rotas de partida consumidas pela UI.
 * Extrai o I/O dos componentes (R-04) seguindo o padrão de
 * `annotationSessionService`.
 */

const matchesClient = {
  ...createMatchEndpoints({ baseUrl: "/api" }),
  ...createReportEndpoints({ baseUrl: "/api" }),
};

export { UnauthorizedError };
export { matchesClient };

export type { TimelinePoint };
