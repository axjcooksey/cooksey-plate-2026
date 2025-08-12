// TypeScript interfaces for Squiggle API responses

export interface SquiggleGame {
  id: number;
  round: number;
  hteam: string;
  ateam: string;
  date: string;
  venue: string;
  complete: number; // 0-100, where 100 = complete
  hscore?: number;
  ascore?: number;
  hgoals?: number;
  agoals?: number;
  hbehinds?: number;
  abehinds?: number;
  winner?: string;
  updated?: string;
  tz?: string;
  localtime?: string;
  hmargin?: number;
  is_final?: number;
  is_grand_final?: number;
  year?: number;
}

export interface SquiggleTeam {
  id: number;
  name: string;
  abbrev: string;
  logo?: string;
  primarycolour?: string;
  secondarycolour?: string;
}

export interface SquiggleApiGamesResponse {
  games: SquiggleGame[];
}

export interface SquiggleApiTeamsResponse {
  teams: SquiggleTeam[];
}

export interface ProcessedGame {
  squiggleGameKey: string;
  roundNumber: number;
  gameNumber: number;
  year: number;
  complete: boolean;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeGoals: number;
  awayGoals: number;
  homeBehinds: number;
  awayBehinds: number;
  venue: string;
  winner: string | null;
  timezone: string;
  rawJson: string;
}

export interface CachedData {
  timestamp: number;
  data: SquiggleApiGamesResponse | SquiggleApiTeamsResponse;
  ttl: number; // Time to live in milliseconds
}