export interface AffiliateAthleteItem {
  id: string;
  name: string;
  nickname: string | null;
  clubName: string | null;
  coachName: string | null;
  dominance: string | null;
  backhand: string | null;
  gender: string | null;
  age: number | null;
  rankings: Record<string, any> | null;
  city: string | null;
  state: string | null;
}
