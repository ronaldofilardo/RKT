/**
 * Funções utilitárias para conversão de pontos do jogo
 * Unificam a lógica entre frontend e backend para evitar inconsistências
 */

export const GAME_POINTS = ["0", "15", "30", "40", "AD"] as const;

/**
 * Converte valor de ponto (string ou number) para índice numérico
 * 0→0, 15→1, 30→2, 40→3, AD→4
 */
export function parsePointValue(value: number | string): number {
  if (typeof value === "number") {
    return Math.min(value, 4);
  }
  
  const upper = value.toUpperCase();
  if (upper === "AD") return 4;
  if (upper === "DEUCE") return 3;
  
  const num = parseInt(value, 10);
  if (isNaN(num)) return 0;
  
  // Mapear 40→3, 30→2, 15→1
  if (num === 40) return 3;
  if (num === 30) return 2;
  if (num === 15) return 1;
  
  return Math.min(num, 4);
}

/**
 * Converte índice numérico para exibição (string)
 * 0→"0", 1→"15", 2→"30", 3→"40", 4→"AD"
 */
export function toDisplayPoint(index: number): string {
  if (index < 0 || index > 4) return "0";
  if (index === 4) return "AD";
  return GAME_POINTS[index];
}

/**
 * Converte índice de progresso para número de pontos
 * Usado para comparar estados
 */
export function pointProgressToIndex(progress: number): number {
  if (progress >= 4) return 4; // AD
  if (progress === 3) return 3; // 40
  if (progress === 2) return 2; // 30
  if (progress === 1) return 1; // 15
  return 0;
}

/**
 * Converte valor de ponto (0, 15, 30, 40, AD, DEUCE) para índice de progresso (0-4)
 * Usado para mapear valores de display para estado do engine
 */
export function pointToProgress(value: number | string): number {
  if (typeof value === "string") {
    if (value === "AD") return 4;
    if (value === "DEUCE") return 3;
    const n = parseInt(value, 10);
    if (n === 40) return 3;
    if (n === 30) return 2;
    if (n === 15) return 1;
    return 0;
  }
  if (value === 40) return 3;
  if (value === 30) return 2;
  if (value === 15) return 1;
  return value;
}

/**
 * Verifica se houve regressão no progresso do game
 * Compara dois estados de game e retorna true se houve regressão
 */
export function isGameRegressing(
  oldGame: { player1: number; player2: number; isDeuce?: boolean; advantage?: string | null },
  newGame: { player1: number; player2: number; isDeuce?: boolean; advantage?: string | null }
): boolean {
  const getProgress = (game: typeof oldGame, player: 'player1' | 'player2'): number => {
    if (!game) return 0;
    const p = typeof game[player] === 'number' ? game[player] : 0;
    
    if (game.isDeuce) {
      if (game.advantage === player) return 4;
      return 3; // Deuce ou vantagem do oponente
    }
    
    return p;
  };
  
  const oldP1 = getProgress(oldGame, 'player1');
  const oldP2 = getProgress(oldGame, 'player2');
  const newP1 = getProgress(newGame, 'player1');
  const newP2 = getProgress(newGame, 'player2');
  
  // Regressão: um jogador perdeu progresso sem que o outro avance
  return (newP1 < oldP1 && newP2 <= oldP2) || (newP2 < oldP2 && newP1 <= oldP1);
}