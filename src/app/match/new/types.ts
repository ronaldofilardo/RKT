export interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
}

export interface Athlete {
  id: string;
  name: string;
  gender?: string;
  age?: number;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Record<string, RankingEntry>;
}