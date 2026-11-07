import { NextRequest, NextResponse } from 'next/server';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { validatedRequest, reportApiError } from '@/lib/api.logic';
import * as authModule from './authenticate';
import { logger } from '@/lib/logger';
import { getActor } from '@/services/accessService';
import { generateLoginToken } from './login-token-logic';
import { computeLoginProfile } from './login-profile-logic';
import { resolveAvailableContexts } from './login-contexts.logic';
import { checkLoginRateLimit, recordLoginAttempt } from './login-ratelimit.logic';
import { applyLoginCookies, resolveLoginArea } from './login-response.logic';
import type { ActorMembership } from '@/core/access';

export async function POST(request: NextRequest) {
  try {
    const payload = await validatedRequest(request, LoginPayloadSchema);
    const identifier = (payload.identifier || payload.email || '').trim();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    await checkLoginRateLimit(ip);

    const authRes = typeof (authModule as any).authenticateUserDetailed === 'function'
      ? await (authModule as any).authenticateUserDetailed(identifier, payload.password)
      : await authModule.authenticateUser(identifier, payload.password);

    const isFailure = !authRes || ('success' in authRes && !authRes.success);
    const user = authRes && 'user' in authRes ? authRes.user : (!isFailure ? authRes : null);

    await recordLoginAttempt(ip, identifier, !!user);

    if (!user) {
      const reason = authRes && 'reason' in authRes ? authRes.reason : 'UNAUTHORIZED';
      const message = authRes && 'message' in authRes ? authRes.message : 'E-mail, CPF ou senha inválidos';
      logger.warn('[LOGIN POST] credenciais inválidas:', reason);
      return NextResponse.json({ error: 'UNAUTHORIZED', code: reason, message }, { status: 401 });
    }

    const availableContexts = await resolveAvailableContexts(user.id);
    let chosenContextId: string | null = payload.contextId ?? null;

    if (availableContexts.length > 1 && !chosenContextId) {
      return NextResponse.json({
        requireContext: true,
        availableContexts,
        user: { id: user.id, name: user.name, email: user.email },
      });
    }

    if (!chosenContextId && availableContexts.length === 1) {
      chosenContextId = availableContexts[0].id;
    }
    if (chosenContextId && !availableContexts.some((c) => c.id === chosenContextId)) {
      chosenContextId = null;
    }

    const actor = await getActor(user.id, chosenContextId).catch(() => null);
    const { effectiveRole, effectiveProfile, platformPreset, membershipKind } =
      computeLoginProfile(actor?.memberships as readonly ActorMembership[] | null | undefined, user.role);

    const chosenContext = availableContexts.find((c) => c.id === chosenContextId);
    const areaForContext = resolveLoginArea(chosenContext);

    const accessToken = await generateLoginToken(
      user.id, effectiveRole, user.sessionVersion, user.mustChangePassword,
      platformPreset, membershipKind, chosenContextId, areaForContext,
      chosenContext?.type === 'CT' ? chosenContextId : undefined,
    );

    const response = NextResponse.json({
      accessToken,
      mustChangePassword: user.mustChangePassword,
      activeContextId: chosenContextId,
      availableContexts,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: effectiveRole,
        profile: effectiveProfile,
        mustChangePassword: user.mustChangePassword,
      },
    });

    applyLoginCookies(response, accessToken, user.mustChangePassword);
    return response;
  } catch (error) {
    logger.error('[LOGIN POST]', error);
    return reportApiError(error);
  }
}
