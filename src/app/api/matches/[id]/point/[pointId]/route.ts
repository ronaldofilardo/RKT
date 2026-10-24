import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { deletePointLog } from './point-void-delete.logic';
import { patchPointAnnotations } from './point-annotations-patch.logic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => deletePointLog({ params }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => patchPointAnnotations(request, { params }));
}
