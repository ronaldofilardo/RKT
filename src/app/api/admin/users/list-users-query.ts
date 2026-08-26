import { ListUsersInputSchema } from '@/schemas/contracts';

export function parseListUsersQuery(searchParams: URLSearchParams) {
  return ListUsersInputSchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? '20',
    role: searchParams.get('role') ?? undefined,
  });
}
