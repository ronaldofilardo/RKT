import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { subscribeMatch } from '@/lib/match-events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
    const { id } = await params;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: {"type":"connected","matchId":"${id}"}\n\n`);

        const cleanup = subscribeMatch(id, (event) => {
          try {
            controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
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
