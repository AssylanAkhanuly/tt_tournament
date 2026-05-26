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
}

export interface Participant {
  id: number;
  user: User;
  joined_at: string;
}

export type ApiError = Record<string, string | string[]>;
