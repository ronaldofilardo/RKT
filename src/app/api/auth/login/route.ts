import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { findPlayerByEmail } from '@/services/playerService';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const player = await findPlayerByEmail(email);

    if (!player) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, player.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    const accessToken = await new SignJWT({
      sub: player.id,
      role: player.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT({
      sub: player.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: player.id,
        name: player.name,
        email: player.email,
        role: player.role,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
