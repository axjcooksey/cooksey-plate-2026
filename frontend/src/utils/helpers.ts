import { format, parseISO, isAfter } from 'date-fns';
import { AFL_TEAMS } from './constants';
import type { Tip, Game, Round } from '../types/api';

// Date formatting utilities
export const formatDate = (dateString: string, formatStr = 'dd/MM/yyyy') => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm');
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'HH:mm');
  } catch {
    return dateString;
  }
};

// Team utilities
export const getTeamAbbreviation = (teamName: string): string => {
  return AFL_TEAMS[teamName as keyof typeof AFL_TEAMS]?.abbrev || teamName.substring(0, 3).toUpperCase();
};

export const getTeamColors = (teamName: string) => {
  return AFL_TEAMS[teamName as keyof typeof AFL_TEAMS]?.colors || { primary: '#6B7280', secondary: '#FFFFFF' };
};

// Game utilities
export const isGameComplete = (game: Game): boolean => {
  return game.is_complete;
};

export const isGameStarted = (game: Game): boolean => {
  return isAfter(new Date(), parseISO(game.start_time));
};

export const getGameResult = (game: Game): string => {
  if (!game.is_complete) return '';
  
  if (game.home_score > game.away_score) {
    return `${game.home_team} won ${game.home_score}-${game.away_score}`;
  } else if (game.away_score > game.home_score) {
    return `${game.away_team} won ${game.away_score}-${game.home_score}`;
  } else {
    return `Draw ${game.home_score}-${game.away_score}`;
  }
};

export const getGameWinner = (game: Game): string | null => {
  if (!game.is_complete) return null;
  
  if (game.home_score > game.away_score) {
    return game.home_team;
  } else if (game.away_score > game.home_score) {
    return game.away_team;
  }
  return null; // Draw
};

// Tip utilities
export const getTipStatus = (tip: Tip): 'correct' | 'incorrect' | 'pending' => {
  if (tip.is_correct === null || tip.is_correct === undefined) return 'pending';
  return tip.is_correct ? 'correct' : 'incorrect';
};

export const getTipDisplayText = (tip: Tip): string => {
  const status = getTipStatus(tip);
  const team = getTeamAbbreviation(tip.selected_team);
  
  switch (status) {
    case 'correct': return `✓ ${team}`;
    case 'incorrect': return `✗ ${team}`;
    case 'pending': return team;
  }
};

// Round utilities
export const getFinalsRoundName = (roundNumber: number): string | null => {
  switch (roundNumber) {
    case 25: return 'Finals Week 1';
    case 26: return 'Semi Finals';
    case 27: return 'Preliminary Finals';
    case 28: return 'Grand Final';
    default: return null;
  }
};

export const getRoundDisplayName = (round: Round): string => {
  const finalsName = getFinalsRoundName(round.round_number);
  return finalsName || `Round ${round.round_number}`;
};

export const isFinalsRound = (roundNumber: number): boolean => {
  return roundNumber >= 25 && roundNumber <= 28;
};

export const getLastGameOfRound = (games: Game[]): Game | null => {
  if (!games || games.length === 0) return null;
  
  // Sort games by start time and return the last one
  const sortedGames = [...games].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  return sortedGames[sortedGames.length - 1];
};

export const isMarginGame = (game: Game, games: Game[], roundNumber: number): boolean => {
  if (!isFinalsRound(roundNumber)) return false;
  
  // Get the last game of the round (sorted by start time)
  const lastGame = getLastGameOfRound(games);
  return lastGame ? lastGame.id === game.id : false;
};

export const isRoundLocked = (round: Round): boolean => {
  if (!round.lockout_time) return false;
  return isAfter(new Date(), parseISO(round.lockout_time));
};

export const getRoundLockoutCountdown = (round: Round): string | null => {
  if (!round.lockout_time || isRoundLocked(round)) return null;
  
  const lockoutTime = parseISO(round.lockout_time);
  const now = new Date();
  const diffMs = lockoutTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return null;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export const getRoundStatus = (round: Round): 'completed' | 'active' | 'upcoming' => {
  // Use the status from the database if available
  if (round.status === 'completed') return 'completed';
  if (round.status === 'active') return 'active';
  
  // Fallback to time-based logic
  if (!round.lockout_time) return 'upcoming';
  
  const now = new Date();
  const lockoutTime = parseISO(round.lockout_time);
  
  if (isAfter(now, lockoutTime)) {
    return 'active'; // Round has started
  }
  
  return 'upcoming';
};

export const getRoundStatusDisplay = (round: Round): { label: string; color: string; emoji: string } => {
  const status = getRoundStatus(round);
  
  switch (status) {
    case 'completed':
      return { label: 'Completed', color: 'bg-green-100 text-green-800', emoji: '🟢' };
    case 'active':
      return { label: 'In Progress', color: 'bg-red-100 text-red-800', emoji: '🔴' };
    case 'upcoming':
      return { label: 'Upcoming', color: 'bg-gray-100 text-gray-800', emoji: '⏳' };
  }
};

// Percentage utilities
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Ranking utilities
export const getRankDisplay = (rank: number): string => {
  const suffix = getRankSuffix(rank);
  return `${rank}${suffix}`;
};

const getRankSuffix = (rank: number): string => {
  if (rank >= 11 && rank <= 13) return 'th';
  
  const lastDigit = rank % 10;
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Validation utilities
export const validateTipSubmission = (tips: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(tips) || tips.length === 0) {
    errors.push('At least one tip is required');
  }
  
  tips.forEach((tip, index) => {
    if (!tip.game_id) {
      errors.push(`Tip ${index + 1}: Missing game ID`);
    }
    if (!tip.selected_team) {
      errors.push(`Tip ${index + 1}: Missing selected team`);
    }
    if (!tip.squiggle_game_key) {
      errors.push(`Tip ${index + 1}: Missing game key`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Local storage utilities
export const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

// Margin prediction utilities
export const validateMarginPrediction = (margin: number | null): { isValid: boolean; error?: string } => {
  if (margin === null || margin === undefined) {
    return { isValid: false, error: 'Margin prediction is required for this game' };
  }
  
  if (isNaN(margin) || margin < 0) {
    return { isValid: false, error: 'Margin must be a positive number' };
  }
  
  if (margin > 200) {
    return { isValid: false, error: 'Margin seems too high (max 200 points)' };
  }
  
  return { isValid: true };
};

export const formatMarginPrediction = (margin: number | null): string => {
  if (margin === null || margin === undefined) return 'No prediction';
  return `${margin} points`;
};

export const getMarginPredictionLabel = (roundNumber: number): string => {
  const roundName = getFinalsRoundName(roundNumber);
  return roundName ? `${roundName} Margin` : 'Margin Prediction';
};

// Error handling utilities
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return 'An unexpected error occurred';
};