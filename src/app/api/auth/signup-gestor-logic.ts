/**
 * Rate limit simples por IP para endpoints de cadastro.
 * Memória em processo: não usar em múltiplas instâncias sem Redis.
 */

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const attemptStore = new Map<string, { count: number; firstAttempt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = attemptStore.get(ip);
  if (!entry) {
    attemptStore.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    attemptStore.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  if (entry.count >= MAX_ATTEMPTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.firstAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }
  entry.count++;
  return { allowed: true };
}

/**
 * Gera slug único a partir do nome fantasia.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function resolveUniqueSlug(prisma: any, name: string): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let exists = await prisma.trainingCenter.findUnique({ where: { slug } });
  let counter = 1;
  while (exists) {
    slug = `${base}-${counter}`;
    exists = await prisma.trainingCenter.findUnique({ where: { slug } });
    counter++;
  }
  return slug;
}
