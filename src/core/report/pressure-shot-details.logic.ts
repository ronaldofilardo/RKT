import type { TimelinePoint } from '@/core/scoring/types';

export interface PointShotDetails {
  executor: 'PLAYER_1' | 'PLAYER_2';
  outcome: 'winner' | 'unforced_error' | 'forced_error';
  stroke?: string;
  strokeSide?: 'forehand' | 'backhand';
  situacao?: string;
}

/**
 * Atribui a autoria de golpes e desfechos de pontos (Fundo, Rede, Passada)
 * de acordo com o plano estabelecido em REFACTOR_QUEUE.md:
 * - Em fundo e devolução: o golpe é de quem errou (em caso de erro) ou de quem venceu (winner).
 * - Vencedor do ponto: winner pertence ao vencedor; EF/ENF pertencem ao adversário.
 * - Vencedor > rede: winner pertence ao vencedor; EF/ENF pertencem ao adversário.
 * - Vencedor > passada: winner pertence ao vencedor; EF/ENF pertencem ao adversário.
 */
export function getPointShotDetails(p: TimelinePoint): PointShotDetails | null {
  const tipo = p.rallyDetails?.tipo ?? (
    p.type === 'WINNER' ? 'winner' :
    p.type === 'UNFORCED_ERROR' ? 'erro_nao_forcado' :
    p.type === 'FORCED_ERROR' ? 'erro_forcado' :
    undefined
  );

  if (!tipo) return null;

  const stroke = p.stroke || p.rallyDetails?.golpe || undefined;
  const situacao = p.rallyDetails?.situacao || undefined;

  let strokeSide: 'forehand' | 'backhand' | undefined;
  if (stroke === 'fh' || stroke === 'vfh') {
    strokeSide = 'forehand';
  } else if (stroke === 'bh' || stroke === 'vbh') {
    strokeSide = 'backhand';
  }

  // Winner: executado pelo vencedor do ponto
  if (tipo === 'winner') {
    return {
      executor: p.winner,
      outcome: 'winner',
      stroke,
      strokeSide,
      situacao,
    };
  }

  // Erros (Forçado ou Não Forçado): executado pelo adversário do vencedor do ponto
  const errorExecutor = p.winner === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
  const outcome = tipo === 'erro_forcado' ? 'forced_error' : 'unforced_error';

  return {
    executor: errorExecutor,
    outcome,
    stroke,
    strokeSide,
    situacao,
  };
}
