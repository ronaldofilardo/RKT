// Implementação canônica movida para `core/scoring/set-completed.logic.ts`
// (regra pura compartilhada entre scoring e dashboard). Re-export mantém os
// imports existentes funcionando.
export {
  isMatchTiebreakSetIndex,
  getTiebreakMinimumForSet,
  isSetCompleted,
} from "@/core/scoring/set-completed.logic";
