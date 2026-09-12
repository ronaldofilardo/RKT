import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { subscribeMatch, getMissedEvents } from '@/lib/match-events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    const { id } = await params;
    const lastEventId =
      request.headers.get('last-event-id') ??
      request.nextUrl.searchParams.get('since') ??
      null;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: {"type":"connected","matchId":"${id}"}\n\n`);

        if (lastEventId) {
          const missed = getMissedEvents(id, lastEventId);
          for (const ev of missed) {
            controller.enqueue(`id: ${ev.id}\ndata: ${JSON.stringify(ev)}\n\n`);
          }
        }

        const cleanup = subscribeMatch(id, (event) => {
          try {
            controller.enqueue(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);
          } catch {
            cleanup();
          }
        });

        request.signal.addEventListener('abort', cleanup);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    }) as unknown as import('next/server').NextResponse;
  });
}
