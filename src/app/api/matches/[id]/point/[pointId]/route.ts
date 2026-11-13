import { NextRequest } from 'next/server';
import { deletePointLog } from './point-void-delete.logic';
import { patchPointAnnotations } from './point-annotations-patch.logic';
import { withPointOwnerAccess } from './point-ownership.logic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> },
) {
  const { id } = await params;
  return withPointOwnerAccess(request, id, () => deletePointLog({ params }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> },
) {
  const { id } = await params;
  return withPointOwnerAccess(request, id, () => patchPointAnnotations(request, { params }));
}
