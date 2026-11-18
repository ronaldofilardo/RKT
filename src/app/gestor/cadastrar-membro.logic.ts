import type { MemberType } from './cadastrar-membro-confirm-modal';
import type { MembroFormData } from './cadastrar-membro-form';

export async function submitMemberApi(
  type: MemberType,
  formData: MembroFormData,
  linkExisting = false,
) {
  const endpoint = type === 'TREINADOR' ? '/api/gestor/coaches' : '/api/gestor/athletes';
  const body: any = { name: formData.name.trim(), cpf: formData.cpf, birthDate: formData.birthDate };
  if (type === 'TREINADOR') {
    body.email = formData.email;
  } else {
    const { gender, dominance: laterality, guardianName, guardianCpf, guardianPhone, guardianContact } = formData;
    Object.assign(body, { email: formData.email || undefined, gender, laterality, guardianName, guardianCpf, guardianPhone, guardianContact });
  }
  if (linkExisting) body.linkExisting = true;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
