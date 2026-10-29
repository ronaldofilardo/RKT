import { NextRequest, NextResponse } from 'next/server';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { validatedRequest, reportApiError } from '@/lib/api.logic';
import { authenticateUser } from './authenticate';
import { logger } from '@/lib/logger';
import { getActor } from '@/services/accessService';
import { generateLoginToken } from './login-token-logic';
import { computeLoginProfile } from './login-profile-logic';
import type { ActorMembership } from '@/core/access';

export async function POST(request: NextRequest) {
  try {
    const payload = await validatedRequest(request, LoginPayloadSchema);
    const identifier = (payload.identifier || payload.email || '').trim();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (process.env.ENABLE_LOGIN_RATELIMIT === 'true') {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentFails = await import('@/lib/prisma').then((m) => m.prisma.loginAttempt.count({
        where: { ip, success: false, createdAt: { gte: fiveMinsAgo } }
      })).catch((error: unknown) => {
        logger.warn('[LOGIN POST] Falha ao contar tentativas de login; rate-limit ignorado:', error);
        return 0;
      });

      if (recentFails > 3) {
        const delayMs = Math.min((recentFails - 3) * 1000, 8000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    const user = await authenticateUser(identifier, payload.password);

    if (process.env.ENABLE_LOGIN_RATELIMIT === 'true') {
      await import('@/lib/prisma').then((m) => m.prisma.loginAttempt.create({
        data: { ip, cpf: identifier, success: !!user }
      })).catch((error: unknown) => {
        logger.warn('[LOGIN POST] Falha ao registrar tentativa de login:', error);
      });
    }
    if (!user) {
      logger.warn('[LOGIN POST] credenciais inválidas');
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'E-mail, CPF ou senha inválidos' },
        { status: 401 },
      );
    }

    const actor = await getActor(user.id).catch(() => null);
    const { effectiveRole, effectiveProfile, platformPreset, membershipKind } =
      computeLoginProfile(actor?.memberships as readonly ActorMembership[] | null | undefined, user.role);

    const accessToken = await generateLoginToken(user.id, effectiveRole, user.sessionVersion, user.mustChangePassword, platformPreset, membershipKind);

    const response = NextResponse.json({
      accessToken,
      mustChangePassword: user.mustChangePassword,
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

    response.cookies.set('rkt_access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    });
    return response;
  } catch (error) {
    logger.error('[LOGIN POST]', error);
    return reportApiError(error);
  }
}
