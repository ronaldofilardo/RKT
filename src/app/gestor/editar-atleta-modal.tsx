'use client';

import { EditAthleteModal, type EditAthleteSavePayload } from '@/app/atletas/EditAthleteModal';

export interface AtletaFormData {
  name: string;
  cpf?: string;
  birthDate: string;
  gender: string;
  dominance: string;
  backhand?: string;
  rankings?: Record<string, any>;
}

interface EditarAtletaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atleta?: { id: string } & AtletaFormData;
  /** false para atleta sem conta de acesso (CPF opcional). Padrão: true. */
  cpfRequired?: boolean;
  onSave: (data: AtletaFormData) => Promise<void> | void;
}

export function EditarAtletaModal({
  open,
  onOpenChange,
  atleta,
  onSave,
  cpfRequired = true,
}: EditarAtletaModalProps) {
  if (!open || !atleta) return null;

  const handleSave = async (payload: EditAthleteSavePayload) => {
    await onSave({
      name: payload.name,
      cpf: payload.cpf,
      birthDate: payload.birthDate || '',
      gender: payload.gender || 'MALE',
      dominance: payload.dominance || 'RIGHT',
      backhand: payload.backhand,
      rankings: payload.rankings,
    });
  };

  return (
    <EditAthleteModal
      isOpen={open}
      athlete={{
        id: atleta.id,
        name: atleta.name,
        cpf: atleta.cpf,
        birthDate: atleta.birthDate,
        gender: atleta.gender,
        dominance: atleta.dominance,
        backhand: atleta.backhand,
        rankings: atleta.rankings,
      }}
      showCpf={true}
      cpfRequired={cpfRequired}
      onClose={() => onOpenChange(false)}
      onSave={handleSave}
    />
  );
}
