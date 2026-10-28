import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../_logic';
import { updateCoachPermissions } from '../../coaches-logic';

const schema = z.object({
  canInsertAthletes: z.boolean(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  const { id } = await context.params;

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const body = await request.json().catch(() => null);
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Payload inválido' }, { status: 400 });
      }

      await updateCoachPermissions(id, { canInsertAthletes: parsed.data.canInsertAthletes });

      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: 'UPDATE_ERROR', message: 'Falha ao atualizar permissões' }, { status: 500 });
    }
  });
}
