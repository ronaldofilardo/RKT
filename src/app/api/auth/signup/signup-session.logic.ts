import { NextResponse } from 'next/server';
import { generateLoginToken } from '@/app/api/auth/login/login-token-logic';
import { applyLoginCookies } from '@/app/api/auth/login/login-response.logic';

interface SessionUser {
  id: string;
  name: string;
  sessionVersion: number;
}

interface SignupSessionExtra {
  accessMode: string;
  playerId: string;
}

/**
 * Emite a sessão do responsável recém-criado (claim `ax: RESPONSAVEL`, mesmo
 * formato do login guardian) e devolve 201 com cookies — o front segue
 * direto para `/responsavel` sem passar pelo `/login`.
 */
export async function respondGuardianSignup(
  user: SessionUser,
  extra: SignupSessionExtra,
): Promise<NextResponse> {
  const token = await generateLoginToken(
    user.id,
    'ANNOTATOR',
    user.sessionVersion,
    false,
    null,
    null,
    null,
    'RESPONSAVEL',
  );

  const response = NextResponse.json(
    { id: user.id, name: user.name, role: 'RESPONSAVEL', redirect: '/responsavel', ...extra },
    { status: 201 },
  );
  applyLoginCookies(response, token, false);
  return response;
}
