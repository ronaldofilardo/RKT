import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { deletePointLog } from './point-void-delete.logic';
import { patchPointAnnotations } from './point-annotations-patch.logic';
import { withPointOwnerAccess } from './point-ownership.logic';

const ParamsSchema = z.object({
  id: flexibleIdValidator,
  pointId: flexibleIdValidator,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> },
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withPointOwnerAccess(request, id, () => deletePointLog({ params }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> },
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withPointOwnerAccess(request, id, () => patchPointAnnotations(request, { params }));
}
