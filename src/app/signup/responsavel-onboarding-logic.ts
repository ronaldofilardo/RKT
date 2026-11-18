import { isMinor } from '@/core/access/age';

/** Dados já validados do formulário principal usados pelo modal de responsável. */
export interface ResponsavelSignupInput {
  name: string;
  identifier: string;
  password: string;
  origem?: string;
}

/** Conclui o onboarding: dispara o callback e navega para o painel parental. */
export function goToResponsavelPanel(push: (path: '/responsavel') => void, onSuccess: () => void): void {
  onSuccess();
  push('/responsavel');
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    window.location.href = '/responsavel';
  }
}

/** Modo de acesso escolhido na Etapa 1 do modal de responsável (A0.21). */
export type ResponsavelAccessMode = 'BASIC' | 'SPECTATOR';

export type ResponsavelRelationship = 'PAI' | 'MAE' | 'TUTOR_LEGAL';

export type ResponsavelPurpose = 'DATA' | 'BROADCAST' | 'STATS';

export interface ResponsavelMinorForm {
  minorName: string;
  minorBirthDate: string;
  minorCpf: string;
  relationship: ResponsavelRelationship;
  purposes: ResponsavelPurpose[];
  declaration: boolean;
}

export const initialMinor: ResponsavelMinorForm = {
  minorName: '',
  minorBirthDate: '',
  minorCpf: '',
  relationship: 'PAI',
  purposes: ['DATA'],
  declaration: false,
};

/** Validação inline da Etapa 2 — devolve a mensagem ou null se válida. */
export function validateMinor(form: ResponsavelMinorForm): string | null {
  if (form.minorName.trim().length < 3) return 'Informe o nome do menor (mínimo 3 letras).';
  if (!form.minorBirthDate) return 'Informe a data de nascimento do menor.';
  if (Number.isNaN(new Date(form.minorBirthDate).getTime())) return 'Data de nascimento inválida.';
  if (!isMinor(form.minorBirthDate)) return 'O responsável legal só pode cadastrar menores de 18 anos.';
  if (!form.purposes.includes('DATA')) return 'O consentimento DATA (ficha esportiva) é obrigatório.';
  if (!form.declaration) return 'A declaração de responsabilidade legal é obrigatória.';
  return null;
}

export function togglePurpose(purposes: ResponsavelPurpose[], purpose: ResponsavelPurpose): ResponsavelPurpose[] {
  if (purpose === 'DATA') return purposes.includes('DATA') ? purposes : [...purposes, 'DATA'];
  return purposes.includes(purpose) ? purposes.filter((p) => p !== purpose) : [...purposes, purpose];
}

/** Payload aninhado `guardianProfile` de `POST /api/auth/signup`. */
export function buildGuardianProfile(
  accessMode: ResponsavelAccessMode,
  form: ResponsavelMinorForm,
): Record<string, unknown> {
  const minorCpf = form.minorCpf.replace(/\D/g, '');
  return {
    accessMode,
    minorName: form.minorName.trim(),
    minorBirthDate: form.minorBirthDate,
    ...(minorCpf ? { minorCpf } : {}),
    relationship: form.relationship,
    purposes: form.purposes,
    declaration: form.declaration,
    termsVersion: '2.0',
    contentHash: 'v2.0-initial-hash',
  };
}
