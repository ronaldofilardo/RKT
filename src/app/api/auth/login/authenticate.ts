import bcrypt from 'bcryptjs';
import { findPlayerByEmail } from '@/services/playerService';

type AuthenticatedPlayer = Awaited<ReturnType<typeof findPlayerByEmail>>;

export async function authenticatePlayer(email: string, password: string): Promise<AuthenticatedPlayer> {
  const player = await findPlayerByEmail(email);
  if (!player) return null;
  const validPassword = await bcrypt.compare(password, player.passwordHash);
  return validPassword ? player : null;
}
