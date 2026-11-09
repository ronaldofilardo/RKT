import type { CreateMatchInput } from '@/schemas/contracts';

/** Campos do template necessários para gerar a anotação derivada. */
export interface TemplateLike {
  player1Id: string;
  player2Id: string;
  player1PartnerId: string | null;
  player2PartnerId: string | null;
  matchType: 'SINGLES' | 'DOUBLES';
  format: CreateMatchInput['format'];
  sportType: string;
  courtType: string | null;
  nickname: string | null;
  scheduledAt: Date | null;
  tournamentName: string | null;
  clubName: string | null;
  category: string | null;
  round: string | null;
  bracketType: string | null;
  temperature: number | null;
  humidity: number | null;
  details: string | null;
}

/**
 * Converte o cartaz público em input de criação da anotação. A derivada é
 * sempre privada (PLAYERS_ONLY) e soberana: copia apenas metadados.
 */
export function buildAnnotationInput(template: TemplateLike): CreateMatchInput {
  return {
    player1Id: template.player1Id,
    player2Id: template.player2Id,
    player1PartnerId: template.player1PartnerId,
    player2PartnerId: template.player2PartnerId,
    matchType: template.matchType,
    format: template.format,
    sportType: template.sportType,
    courtType: template.courtType,
    nickname: template.nickname,
    visibility: 'PLAYERS_ONLY',
    openForAnnotation: false,
    scheduledAt: template.scheduledAt,
    tournamentName: template.tournamentName,
    clubName: template.clubName,
    category: template.category,
    roundName: template.round,
    bracketType: template.bracketType,
    temperature: template.temperature,
    humidity: template.humidity,
    details: template.details,
    isPublicTemplate: false,
  };
}
