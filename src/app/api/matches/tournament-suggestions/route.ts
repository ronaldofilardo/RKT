import { NextRequest, NextResponse } from 'next/server';
import { getTournamentSuggestions } from '@/services/matchSuggestionService';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tournamentName = searchParams.get('tournamentName') ?? '';

  try {
    const suggestions = await getTournamentSuggestions(tournamentName);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('[TOURNAMENT_SUGGESTIONS]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}