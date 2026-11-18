import type { RankingEntry } from './edit-athlete-modal.logic';

export interface EditAthleteSavePayload {
  name: string;
  nickname?: string;
  cpf?: string;
  gender?: string;
  birthDate?: string;
  dominance?: string;
  backhand?: string;
  rankings?: Record<string, RankingEntry>;
  club?: string;
  city?: string;
  state?: string;
  isExternalClub?: boolean;
  guardianName?: string;
  guardianCpf?: string;
  guardianPhone?: string;
  guardianContact?: string;
}

export interface EditAthleteModalProps {
  athlete?: {
    id?: string;
    name: string;
    nickname?: string | null;
    cpf?: string | null;
    gender?: string | null;
    age?: number | null;
    birthDate?: string | null;
    dominance?: string | null;
    backhand?: string | null;
    rankings?: Record<string, RankingEntry> | null;
    guardianName?: string | null;
    guardianCpf?: string | null;
    guardianPhone?: string | null;
    guardianContact?: string | null;
  } | null;
  isOpen: boolean;
  title?: string;
  saveLabel?: string;
  readOnly?: boolean;
  showCpf?: boolean;
  cpfRequired?: boolean;
  guardianImmutable?: boolean;
  isParticularCoach?: boolean;
  onClose: () => void;
  onSave: (data: EditAthleteSavePayload) => Promise<void>;
}
