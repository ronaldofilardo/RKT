import type { RankingEntry } from './edit-athlete-modal.logic';

export interface EditAthleteSavePayload {
  name: string;
  gender?: string;
  birthDate?: string;
  dominance?: string;
  backhand?: string;
  rankings?: Record<string, RankingEntry>;
}

export interface EditAthleteModalProps {
  athlete: {
    id: string;
    name: string;
    gender?: string | null;
    age?: number | null;
    birthDate?: string | null;
    dominance?: string | null;
    backhand?: string | null;
    rankings?: Record<string, RankingEntry> | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditAthleteSavePayload) => Promise<void>;
}
