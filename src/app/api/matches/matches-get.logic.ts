import { NextRequest, NextResponse } from 'next/server';
import { MatchStateSchema } from '@/schemas/contracts';
import { listMatches } from '@/services/matchService';
import { reportApiError, extractPagination } from '@/lib/api.logic';
import type { TennisFormat } from '@/core/scoring/types';
import { logger } from '@/lib/logger';

type RLSUser = { id: string; role: string } | null | undefined;

export async function getMatchesResponse(
  request: NextRequest,
  user: RLSUser,
): Promise<NextResponse> {
  try {
    if (!user || user.role !== 'ANNOTATOR') {
      return NextResponse.json({ data: { matches: [], nextCursor: null } });
    }

    const { searchParams } = request.nextUrl;
    const stateParam = searchParams.get('state');
    const { cursor, limit } = extractPagination(searchParams);

    let state: ReturnType<typeof MatchStateSchema.parse> | undefined;
    if (stateParam) {
      const parsed = MatchStateSchema.safeParse(stateParam);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'INVALID_STATE',
            message: `state deve ser um de: ${MatchStateSchema.options.join(', ')}`,
          },
          { status: 400 },
        );
      }
      state = parsed.data;
    }

    const matches = await listMatches(state, cursor, limit, user.id);
    const nextCursor = matches.length === limit ? matches[matches.length - 1].id : null;

    const { normalizeScoreState } = await import('@/core/scoring/score-normalizer');
    const payloadMatches = matches.map(m => {
      const { scoreState, ...rest } = m;
      return {
        ...rest,
        scoreSummary: scoreState ? normalizeScoreState(scoreState, m.format as TennisFormat) : null
      };
    });

    return NextResponse.json({ data: { matches: payloadMatches, nextCursor } });
  } catch (error) {
    logger.error('[MATCHES GET]', error);
    return reportApiError(error);
  }
}
