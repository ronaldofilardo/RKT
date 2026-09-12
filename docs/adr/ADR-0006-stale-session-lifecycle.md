# ADR-0006: Ciclo de Vida e Expiração de Sessões de Anotação (Locks Órfãos)

**Status:** Accepted  
**Data:** 2026-09-11  
**Owner:** @arquitetura  
**Supersedes:** —  
**Depends on:** ADR-0001, ADR-0004, TD-004  

---

## Contexto

O RKT suporta anotação concorrente e suspensão de sessões via entidade `MatchAnnotationSession`.
Quando um anotador inicia a sessão, o registro é gravado com `isActive: true` e status `IN_PROGRESS`.

### Problema
Se o usuário fechar o navegador, perder a conectividade sem emitir o evento de encerramento (`abandon` ou `finish`), ou deixar a sessão inativa por longos períodos:
1. A sessão permanecia indefinidamente com `isActive: true`.
2. A rota `POST /api/matches/[id]/point` podia recusar anotações de outros técnicos por conflito de sessão ativa.
3. A rota `GET /api/matches/suspended-sessions` acumulava sessões fantasmas/órfãs sem prazo de expiração.

---

## Decisão

Implementar uma política de **lease / timeout de inatividade** de 4 horas para sessões de anotação através da função centralizada `cleanupStaleSessions` em `src/services/sessionService.ts`.

### Regras de Expiração
1. **Janela de Inatividade:** Sessões ativas com mais de 4 horas sem conclusão formal têm seu lock liberado (`isActive: false`, `status: "ABANDONED"`).
2. **Desativação Automática:** A rotina pode ser acionada pontualmente por partida (`cleanupStaleSessions({ matchId })`) ou em varredura global.
3. **Resiliência Transacional:** Na reativação ou criação de sessão (`reactivateOrCreateSession`), locks órfãos da partida são automaticamente normalizados sem travar a interface do usuário.

---

## Consequências

- **Positivas:**
  - Elimina locks órfãos e recupera partidas travadas por quedas de rede de anotadores.
  - Mantém o histórico e o snapshot de pontos (`matchStateSnapshot`) para auditoria futura.
- **Testabilidade:**
  - Testes de baseline em `src/services/__tests__/annotation-session-lifecycle.baseline.characterization.test.ts` garantem a observância do corte temporal.
