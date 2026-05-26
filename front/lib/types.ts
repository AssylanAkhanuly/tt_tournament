export interface User {
  id: string;
  phone: string;
  name: string;
  is_staff: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  join_token: string;
  created_by: User;
  created_at: string;
  starts_at: string | null;
  participant_count: number;
  status: "open" | "in_progress" | "finished";
}

export interface Participant {
  id: number;
  user: User;
  joined_at: string;
}

export interface Match {
  id: number;
  round_number: number;
  match_number: number;
  player1: User | null;
  player2: User | null;
  score1: number | null;
  score2: number | null;
  winner: User | null;
  status: "pending" | "in_progress" | "finished";
}

export type ApiError = Record<string, string | string[]>;
