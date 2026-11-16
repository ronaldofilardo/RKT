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
  guardianName?: string;
  guardianCpf?: string;
  guardianPhone?: string;
  guardianContact?: string;
}

interface EditarAtletaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atleta?: { id: string } & AtletaFormData;
  cpfRequired?: boolean;
  guardianImmutable?: boolean;
  readOnly?: boolean;
  onSave?: (data: AtletaFormData) => Promise<void> | void;
}

export function EditarAtletaModal({
  open,
  onOpenChange,
  atleta,
  onSave,
  cpfRequired = true,
  guardianImmutable = false,
  readOnly = false,
}: EditarAtletaModalProps) {
  if (!open || !atleta) return null;

  const handleSave = async (payload: EditAthleteSavePayload) => {
    if (!onSave) return;
    await onSave({
      name: payload.name,
      cpf: payload.cpf,
      birthDate: payload.birthDate || '',
      gender: payload.gender || 'MALE',
      dominance: payload.dominance || 'RIGHT',
      backhand: payload.backhand,
      rankings: payload.rankings,
      guardianName: payload.guardianName,
      guardianCpf: payload.guardianCpf,
      guardianPhone: payload.guardianPhone,
      guardianContact: payload.guardianContact,
    });
  };

  return (
    <EditAthleteModal
      isOpen={open}
      readOnly={readOnly}
      guardianImmutable={guardianImmutable}
      athlete={{
        id: atleta.id,
        name: atleta.name,
        cpf: atleta.cpf,
        birthDate: atleta.birthDate,
        gender: atleta.gender,
        dominance: atleta.dominance,
        backhand: atleta.backhand,
        rankings: atleta.rankings,
        guardianName: atleta.guardianName,
        guardianCpf: atleta.guardianCpf,
        guardianPhone: atleta.guardianPhone,
        guardianContact: atleta.guardianContact,
      }}
      showCpf={true}
      cpfRequired={cpfRequired}
      onClose={() => onOpenChange(false)}
      onSave={handleSave}
    />
  );
}
