export async function patchUser(userId: string, data: any): Promise<void> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar usuário');
}

export async function patchTrainingCenter(ctId: string, data: any): Promise<void> {
  const res = await fetch(`/api/training-centers/${ctId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar clube');
}

