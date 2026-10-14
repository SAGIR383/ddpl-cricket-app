export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BattingStyle = 'Right-hand bat' | 'Left-hand bat';
export type BowlingStyle =
  | 'Right-arm fast'
  | 'Right-arm medium'
  | 'Right-arm off-spin'
  | 'Right-arm leg-spin'
  | 'Left-arm fast'
  | 'Left-arm medium'
  | 'Left-arm orthodox'
  | 'Left-arm chinaman'
  | 'None';

export type PlayerRole = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
export type SystemRole = 'super_admin' | 'organizer' | 'scorer' | 'user';

export type SeasonStatus =
  | 'draft'
  | 'registration_open'
  | 'auction_scheduled'
  | 'auction_live'
  | 'in_progress'
  | 'completed'
  | 'archived';

export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned' | 'postponed';
export type AuctionStatus = 'upcoming' | 'live' | 'paused' | 'completed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  employee_id: string | null;
  phone: string | null;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
  primary_role: PlayerRole;
  system_role: SystemRole;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  created_at: string;
}

export interface TournamentSeason {
  id: string;
  tournament_id: string;
  season_year: number;
  name: string;
  status: SeasonStatus;
  start_date: string | null;
  end_date: string | null;
  overs_per_innings: number;
  min_squad_size: number;
  max_squad_size: number;
  points_for_win: number;
  points_for_tie: number;
  points_for_no_result: number;
  points_for_loss: number;
  settings: Record<string, any>;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  primary_color: string;
  created_at: string;
}

export interface TeamSeasonRegistration {
  id: string;
  season_id: string;
  team_id: string;
  owner_user_id: string | null;
  captain_player_id: string | null;
  vice_captain_player_id: string | null;
  allocated_budget: number;
  spent_budget: number;
  created_at: string;
  team?: Team;
}

export interface TournamentPlayer {
  id: string;
  season_id: string;
  profile_id: string | null;
  registered_name: string;
  photo_url: string | null;
  role: PlayerRole;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
  base_price: number;
  max_bid_limit: number | null;
  registration_status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
}

export interface SquadMember {
  id: string;
  team_season_id: string;
  tournament_player_id: string;
  purchase_price: number;
  acquisition_type: 'auction' | 'retained' | 'direct' | 'replacement';
  created_at: string;
  player?: TournamentPlayer;
}

export interface Auction {
  id: string;
  season_id: string;
  name: string;
  budget_per_team: number;
  default_base_price: number;
  bid_increment: number;
  status: AuctionStatus;
  current_state: {
    player_id?: string;
    player_name?: string;
    photo_url?: string | null;
    role?: PlayerRole;
    current_bid?: number;
    highest_team_season_id?: string;
    highest_team_name?: string;
    bid_step?: number;
    last_bid_at?: string;
  } | null;
  created_at: string;
}

export interface Match {
  id: string;
  season_id: string;
  match_number: number;
  match_title: string | null;
  round_type: string;
  team_a_season_id: string;
  team_b_season_id: string;
  match_date: string | null;
  venue: string;
  overs_limit: number;
  toss_winner_team_id: string | null;
  toss_decision: 'bat' | 'bowl' | null;
  status: MatchStatus;
  winner_team_id: string | null;
  win_margin_type: 'runs' | 'wickets' | 'tie' | 'no_result' | null;
  win_margin_value: number | null;
  result_summary: string | null;
  player_of_the_match_id: string | null;
  scorer_user_id: string | null;
  created_at: string;
  team_a?: TeamSeasonRegistration;
  team_b?: TeamSeasonRegistration;
}

export interface MatchInnings {
  id: string;
  match_id: string;
  innings_number: number;
  batting_team_season_id: string;
  bowling_team_season_id: string;
  total_runs: number;
  total_wickets: number;
  total_legal_balls: number;
  extras_wides: number;
  extras_no_balls: number;
  extras_byes: number;
  extras_leg_byes: number;
  extras_penalties: number;
  is_completed: boolean;
  is_all_out: boolean;
  created_at: string;
}

export interface MatchDelivery {
  id: number;
  innings_id: string;
  over_number: number;
  ball_in_over: number;
  striker_id: string;
  non_striker_id: string;
  bowler_id: string;
  runs_batter: number;
  runs_extras: number;
  extra_type: 'none' | 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty';
  is_legal_ball: boolean;
  is_wicket: boolean;
  wicket_type: string;
  dismissed_player_id: string | null;
  fielder_id: string | null;
  commentary: string | null;
  created_at: string;
}
