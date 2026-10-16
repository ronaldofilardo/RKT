type MatchPayloadFields = {
  sportType: string; format: string; courtType: string; player1Id?: string; player2Id?: string;
  nickname: string; visibility: string; openForAnnotation: boolean; anotadorEmail: string; date: string; time: string;
  venueId: string; publicMatchCode: string; tournamentName: string; clubName: string; category: string; roundName: string;
  bracketType: string; temperature: string; humidity: string; tags: string; details: string;
};

const optionalText = (value: string) => value || null;
const optionalNumber = (value: string) => value ? parseFloat(value) : null;
const scheduledAt = (date: string, time: string) => {
  if (!date) return undefined;
  if (time) return new Date(`${date}T${time}`).toISOString();
  return new Date(`${date}T00:00:00`).toISOString();
};

export function buildMatchPayload(fields: MatchPayloadFields, overrides?: Record<string, unknown>) {
  return {
    sportType: fields.sportType,
    format: fields.format,
    courtType: fields.sportType === 'TENNIS' ? fields.courtType : null,
    player1Id: fields.player1Id,
    player2Id: fields.player2Id,
    nickname: optionalText(fields.nickname),
    visibility: fields.visibility || 'PLAYERS_ONLY',
    openForAnnotation: fields.openForAnnotation,
    anotadorEmail: optionalText(fields.anotadorEmail),
    scheduledAt: scheduledAt(fields.date, fields.time),
    venueId: optionalText(fields.venueId),
    publicMatchCode: optionalText(fields.publicMatchCode),
    tournamentName: optionalText(fields.tournamentName),
    clubName: optionalText(fields.clubName),
    category: optionalText(fields.category),
    roundName: optionalText(fields.roundName),
    bracketType: optionalText(fields.bracketType),
    temperature: optionalNumber(fields.temperature),
    humidity: optionalNumber(fields.humidity),
    tags: optionalText(fields.tags),
    details: optionalText(fields.details),
    ...overrides,
  };
}
