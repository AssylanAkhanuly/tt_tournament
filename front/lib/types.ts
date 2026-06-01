export interface User {
  id: string;
  phone: string;
  name: string;
  rating: number;
  is_staff: boolean;
  /** Club IDs where this user has ClubAdmin role */
  club_ids_admin: string[];
  avatar: string | null;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  created_at: string;
  photo: string | null;
  table_count: number;
  tournament_count: number;
  admin_count: number;
  /** True if the current authenticated user is admin of this club */
  is_admin: boolean;
}

export interface ClubTable {
  id: number;
  number: number;
  name: string;
  display_name: string;
  is_active: boolean;
}

export interface TournamentTable {
  id: number;
  number: number;
  name: string;
  display_name: string;
  is_active: boolean;
}

export interface ClubAdmin {
  id: number;
  user: User;
  added_at: string;
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
  club_id: string | null;
  club_name: string | null;
  format: "single_elimination" | "group_playoff";
  group_size: number;
  /** True if the current authenticated user is already a participant. */
  is_registered: boolean;
}

export interface Participant {
  id: number;
  user: User;
  joined_at: string;
  /** No-show: matches excluded from rating, 0 group points, unplayed matches forfeited */
  is_absent: boolean;
  /** RTTF rating snapshot, set when the tournament finishes */
  rating_before: number | null;
  rating_change: number | null;
  /** Present only when admin just created the user */
  created_user?: boolean;
  temp_password?: string;
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
  table_number: number | null;
  is_consolation: boolean;
  winner_next_id: number | null;
  loser_next_id:  number | null;
  /** Range of final places this match's participants can finish in (all-places playoff). */
  place_lo: number | null;
  place_hi: number | null;
}

export interface GroupMatch {
  id: number;
  match_number: number;
  player1: User;
  player2: User;
  score1: number | null;
  score2: number | null;
  winner: User | null;
  status: "pending" | "in_progress" | "finished";
  table_number: number | null;
  /** Auto-recorded forfeit because an opponent was marked absent */
  is_walkover: boolean;
}

export interface GroupParticipant {
  id: number;
  user: User;
  /** Fixed seed position within the group (snake-seed order) */
  seed: number;
  points: number;
  wins: number;
  losses: number;
  diff: number;
  /** Standings rank (1 = top); changes with results, rows stay in seed order */
  place: number;
  /** No-show: 0 points, matches excluded from rating */
  is_absent: boolean;
}

export interface TournamentGroup {
  id: number;
  name: string;
  order: number;
  participants: GroupParticipant[];
  matches: GroupMatch[];
}

export type ApiError = Record<string, string | string[]>;
