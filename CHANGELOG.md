# Arquivos alterados — correção do /report (segmentos de anotação)

Mantenha a mesma estrutura de pastas ao copiar para o projeto (bkpRKT/).

1. prisma/schema.prisma
   - Novo model MatchScoreEdit + relação em Match.scoreEdits

2. src/schemas/contracts.ts
   - Novo campo isManualScoreEdit em MatchStateInputSchema

3. src/services/matchService.ts
   - transitionMatchState grava MatchScoreEdit antes de sobrescrever scoreState
   - Nova função getMatchScoreEdits

4. src/app/api/matches/[id]/state/route.ts
   - Repassa isManualScoreEdit e editedByUserId

5. src/hooks/useScoringHandlers.persistence.ts
   - persistStateWithRetry propaga isManualScoreEdit no PATCH

6. src/hooks/useScoringHandlers.ts
   - persistState aceita e repassa isManualScoreEdit

7. src/hooks/useSessionManager.ts
   - handleEditScore marca isManualScoreEdit: true

8. src/app/api/matches/[id]/report/route.ts
   - Reescrito: reconstrói timeline em segmentos via MatchScoreEdit,
     com marcador segmentBreak entre trechos

9. src/core/scoring/types.ts
   - TimelinePoint.segmentBreak (opcional)

10. src/components/scoring/timeline-rows.tsx
    - Renderiza divisor de "partida interrompida" quando segmentBreak existe

11. src/core/scoring/scoring-logic.ts
    - Correção do bug isBreakPoint (usava games do set, não pontos do game)

## Após copiar
    npx prisma format && npx prisma generate
    npx prisma migrate dev --name add_match_score_edit
    npx tsc --noEmit
    npm test
