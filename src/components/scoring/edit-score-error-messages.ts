export function getEditScoreErrorMessage(code: string): string {
  const map: Record<string, string> = {
    SCORE_REGRESSION: 'Não é possível reduzir sets vencidos.',
    INVALID_TRANSITION: 'Transição de estado inválida.',
    VALIDATION_ERROR: 'Dados inválidos.',
    CANNOT_FINISH: 'Não foi possível encerrar a partida.',
    FORBIDDEN: 'Sem permissão.',
    VERSION_CONFLICT: 'Atualização simultânea no servidor.',
    PERSIST_FAILED: 'Falha ao salvar placar editado. Tente novamente.',
    busy: 'Uma operação de sincronização já está em andamento. Aguarde um instante.',
  };
  return map[code] ?? 'Erro ao editar placar.';
}