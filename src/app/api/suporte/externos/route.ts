import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import {
  collectExternalClubs,
  fetchCenterStatusByName,
  fetchClubsWithLocation,
  fetchExternalPlayers,
  mapExternalAthlete,
} from './externos-query.logic';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'athlete:search', null, async () => {
    try {
      const players = await fetchExternalPlayers();
      const clubsSet = collectExternalClubs(players);
      const centerStatusByName = await fetchCenterStatusByName();
      const clubsWithLocation = await fetchClubsWithLocation(
        Array.from(clubsSet),
        centerStatusByName,
      );

      return NextResponse.json({
        athletes: players.map(mapExternalAthlete),
        clubs: clubsWithLocation,
        totalAthletes: players.length,
        totalClubs: clubsWithLocation.length,
      }, { status: 200 });
    } catch (error) {
      logger.error('[SUPORTE EXTERNOS GET]', error);
      return reportApiError(error);
    }
  });
}
