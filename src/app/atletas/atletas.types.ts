export interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
  juvenilePosition?: number;
}

export interface Athlete {
  id: string;
  name: string;
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
  dominance?: string | null;
  backhand?: string | null;
  ranking?: number | null;
  rankings?: Record<string, RankingEntry> | null;
  city?: string | null;
  state?: string | null;
  club?: string | null;
  clubName?: string | null;
  createdAt?: string | null;
  createdByUserId?: string | null;
}
