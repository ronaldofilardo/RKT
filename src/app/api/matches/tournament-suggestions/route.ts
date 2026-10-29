import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withAccessHandler } from '@/lib/access-handler';
import { getTournamentSuggestions } from '@/services/matchSuggestionService';
import { z } from 'zod';

const TournamentSuggestionsQuerySchema = z.object({
  tournamentName: z.string().max(100).default(''),
});

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async () => {
    const { searchParams } = request.nextUrl;
    const raw = searchParams.get('tournamentName') ?? '';
    const parsed = TournamentSuggestionsQuerySchema.safeParse({ tournamentName: raw });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const suggestions = await getTournamentSuggestions(parsed.data.tournamentName);
      return NextResponse.json(suggestions);
    } catch (error) {
      logger.error('[TOURNAMENT_SUGGESTIONS]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
