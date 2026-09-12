/**
 * TEMPLATE DE ROUTE HANDLER — API rkt
 * 
 * Copie este arquivo como base para novas API routes.
 * Ajuste: [resource], [Resource], [resourceService]
 * 
 * Owner: @backend
 * Status: Template oficial (Onda 1 — Guardrails)
 * 
 * INSTRUÇÕES:
 * 1. Copie este arquivo para a pasta da sua API (ex: /api/players/route.ts)
 * 2. Substitua todos os [resource] por "players" (lowercase)
 * 3. Substitua todos os [Resource] por "Player" (PascalCase)
 * 4. Substitua [resourceService] pelo service (ex: playerService)
 * 5. Ajuste schemas e roles conforme necessário
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { handleApiError, extractPagination } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
// import { [Resource]Schema } from '@/schemas/contracts';
// import { [resourceService] } from '@/services/[resource]Service';

// ============================================================================
// GET /api/[resource]
// ============================================================================

export async function GET(request: NextRequest) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
    try {
      const { searchParams } = request.nextUrl;
      void extractPagination(searchParams);

      // const data = await [resourceService].list({ cursor, limit });
      // return jsonResponse(data, {
      //   headers: { 'Cache-Control': 'private, max-age=60' }
      // });

      return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
    } catch (error) {
      logger.error('[RESOURCE GET]', error);
      return handleApiError(error);
    }
  });
}

// ============================================================================
// POST /api/[resource]
// ============================================================================

export async function POST(request: NextRequest) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      // const body = await validatedRequest(request, [Resource]Schema);
      // const resource = await [resourceService].create(body);
      // return jsonResponse(resource, { status: 201 });

      return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
    } catch (error) {
      logger.error('[RESOURCE POST]', error);
      return handleApiError(error);
    }
  });
}

// ============================================================================
// PUT /api/[resource]/:id
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  return withRLSHandler(request, 'GESTOR', async () => {
    try {
      // const body = await validatedRequest(request, [Resource]Schema.partial());
      // const resource = await [resourceService].update(params.id, body);
      // if (!resource) {
      //   throw new NotFoundError('[Resource]', params.id);
      // }
      // return jsonResponse(resource);

      return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
    } catch (error) {
      logger.error('[RESOURCE PUT]', error);
      return handleApiError(error);
    }
  });
}

// ============================================================================
// DELETE /api/[resource]/:id
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  return withRLSHandler(request, 'GESTOR', async () => {
    try {
      // await [resourceService].delete(params.id);
      // return new NextResponse(null, { status: 204 });

      return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
    } catch (error) {
      logger.error('[RESOURCE DELETE]', error);
      return handleApiError(error);
    }
  });
}