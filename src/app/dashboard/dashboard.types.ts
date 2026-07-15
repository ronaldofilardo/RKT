export type DashboardView =
  | "dashboard"
  | "history"
  | "annotated"
  | "live"
  | "pending"
  | "profile";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Match {
  id: string;
  player1: { name: string };
  player2: { name: string };
  state: "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  format: string;
  scheduledAt?: string;
}

export interface Athlete {
  id: string;
  name: string;
  gender?: string;
  age?: number;
  dominance?: string;
  backhand?: string;
  ranking?: number;
}

export interface SuspendedMatch extends Match {
  suspendedSessionId?: string;
  matchStateSnapshot?: any;
  scoreState?: any;
}