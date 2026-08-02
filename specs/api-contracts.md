# Contratos de API — Racket App

## Autenticação
| Método | Endpoint         | Auth | Body              | Response         |
|--------|------------------|------|-------------------|------------------|
| POST   | /api/auth/login  | ❌   | `LoginPayload`    | `AuthResponse`   |
| POST   | /api/auth/logout | ✅   | —                 | `204`            |

## Players
| Método | Endpoint     | Auth | Roles Mínimos | Body | Response     |
|--------|--------------|------|---------------|------|--------------|
| GET    | /api/players | ✅   | SPECTATOR     | —    | `Player[]`   |

## Matches
| Método | Endpoint                                    | Auth | Roles Mínimos | Body               | Response        |
|--------|---------------------------------------------|------|---------------|--------------------|-----------------|
| GET    | /api/matches                                | ✅   | SPECTATOR     | —                  | `Match[]`       |
| POST   | /api/matches                                | ✅   | ATHLETE       | `CreateMatchInput` | `Match`         |
| GET    | /api/matches/:id                            | ✅   | SPECTATOR     | —                  | `Match`         |
| PUT    | /api/matches/:id                            | ✅   | GESTOR        | `Match` fields     | `Match`         |
| DELETE | /api/matches/:id                            | ✅   | GESTOR        | —                  | `{success}`     |
| PATCH  | /api/matches/:id/state                      | ✅   | ATHLETE       | `MatchStateInput`  | `Match`         |
| POST   | /api/matches/:id/point                      | ✅   | ATHLETE       | `PointFlowInput`   | `MatchState`    |
| GET    | /api/matches/:id/report                     | ✅   | ATHLETE       | —                  | `MatchReport`   |
| GET    | /api/matches/:id/sessions                   | ✅   | SPECTATOR     | —                  | `Session[]`     |
| POST   | /api/matches/:id/sessions                   | ✅   | COACH         | —                  | `Session`       |
| GET    | /api/matches/:id/sessions/:sessionId        | ✅   | SPECTATOR     | —                  | `Session`       |
| PATCH  | /api/matches/:id/sessions/:sessionId        | ✅   | COACH         | `EndSessionInput`  | `Session`       |
| POST   | /api/matches/:id/sessions/:sessionId/abandon| ✅   | ANNOTATOR     | —                  | `Session`       |
| POST   | /api/matches/:id/sessions/:sessionId/endorse| ✅   | COACH         | —                  | `Endorsement`   |
| GET    | /api/matches/suspended-sessions             | ✅   | ATHLETE       | —                  | `{matches}`     |

## Regras de Negócio
1. Um Match só pode ser finalizado se `ScoringEngine.isFinished() === true`
2. Hierarquia de roles: `ADMIN(5)` > `GESTOR(4)` > `COACH(3)` > `ATHLETE(2)` > `SPECTATOR(1)`
4. Rotas de escrita exigem role ≥ ATHLETE (configuração da partida) ou ≥ COACH (anotações)
5. A role `ANNOTATOR` é um contexto de uso correspondente a `COACH` + sessão ativa
6. Sessões de anotação seguem o ciclo: `IN_PROGRESS` → `COMPLETED` | `ABANDONED`
