// API request/response types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  timestamp?: string;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  family_group_id: number;
  role: 'user' | 'admin';
  created_at: string;
  family_group_name?: string;
}

export interface FamilyGroup {
  id: number;
  name: string;
  created_at: string;
  members?: User[];
  member_count?: number;
}

export interface Round {
  id: number;
  round_number: number;
  year: number;
  status: 'upcoming' | 'active' | 'completed';
  lockout_time?: string;
  created_at: string;
  game_count?: number;
  completed_games?: number;
}

export interface Game {
  id: number;
  squiggle_game_key: string;
  round_id: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  start_time: string;
  venue: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  round_number?: number;
}

export interface Tip {
  id: number;
  user_id: number;
  game_id: number;
  squiggle_game_key: string;
  round_id: number;
  selected_team: string;
  is_correct?: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  home_team?: string;
  away_team?: string;
  venue?: string;
}

export interface TipSubmission {
  game_id: number;
  squiggle_game_key: string;
  selected_team: string;
  tip_for_user?: string; // For family members or admin tipping for others
}

export interface RoundTipsRequest {
  round_id: number;
  tips: TipSubmission[];
}

export interface LadderEntry {
  user_id: number;
  user_name: string;
  family_group_name: string;
  total_tips: number;
  correct_tips: number;
  percentage: number;
  rank: number;
  latest_round?: number;
}

export interface LadderResponse {
  ladder: LadderEntry[];
  year: number;
  last_updated: string;
  total_rounds: number;
  completed_rounds: number;
}