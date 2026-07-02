# Glossário de Domínio — Racket App

## Entidades Centrais

| Termo              | Definição                                                                 |
|--------------------|---------------------------------------------------------------------------|
| **Match**          | A entidade raiz. Possui um `format` e um `state`.                         |
| **Scoring Engine** | Motor puro (agnóstico de UI/Backend) que processa `PointFlow`.            |
| **Annotation Session** | Contexto de anotação tática vinculado a um `Match`.                   |
| **Tenant (Club)**  | Unidade de isolamento de dados. Nenhuma rota existe sem `ClubContext`.    |
| **Offline Queue**  | Fila de intenção de escrita que aguarda conectividade.                    |
| **PointFlow**      | Evento atômico de ponto: quem ganhou, tipo, contexto.                     |
| **Set**            | Agrupamento de games dentro de um Match.                                  |
| **Game**           | Unidade de pontuação interna ao Set.                                      |
| **Deuce**          | Estado de empate em 40-40 dentro de um Game.                              |
| **Advantage**      | Estado após um ponto no Deuce.                                            |

## Estados do Match
- `SCHEDULED` → `IN_PROGRESS` → `FINISHED` | `CANCELLED`

## Roles (RBAC)
`ADMIN` > `GESTOR` > `COACH` > `ATHLETE` > `SPECTATOR`
