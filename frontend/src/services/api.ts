import axios from 'axios';
import type { 
  ApiResponse, 
  User, 
  FamilyGroup, 
  Team, 
  Round, 
  Game, 
  Tip, 
  TipSubmission, 
  LadderResponse,
  FinalsConfig,
  RoundWinner
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export class ApiService {
  // Health check
  static async health(): Promise<{ status: string; message: string }> {
    const response = await api.get('/health');
    return response.data;
  }

  // Users
  static async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await api.get('/api/users');
    return response.data;
  }

  static async getUserById(id: number): Promise<ApiResponse<User>> {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  }

  static async getUserByName(name: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/api/users/name/${encodeURIComponent(name)}`);
    return response.data;
  }

  static async getUsersCanTipFor(userId: number): Promise<ApiResponse<User[]>> {
    const response = await api.get(`/api/users/${userId}/can-tip-for`);
    return response.data;
  }

  static async getUserStats(userId: number, year?: number): Promise<ApiResponse<any>> {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/api/users/${userId}/stats${params}`);
    return response.data;
  }

  // Family Groups
  static async getFamilyGroups(): Promise<ApiResponse<FamilyGroup[]>> {
    const response = await api.get('/api/family-groups');
    return response.data;
  }

  static async getFamilyGroupById(id: number): Promise<ApiResponse<FamilyGroup>> {
    const response = await api.get(`/api/family-groups/${id}`);
    return response.data;
  }

  // Teams
  static async getTeams(): Promise<ApiResponse<Team[]>> {
    const response = await api.get('/api/squiggle/teams');
    return response.data;
  }

  // Rounds
  static async getCurrentRound(year: number): Promise<ApiResponse<Round>> {
    const response = await api.get(`/api/rounds/current/${year}`);
    return response.data;
  }

  static async getRounds(year: number): Promise<ApiResponse<Round[]>> {
    const response = await api.get(`/api/rounds/${year}`);
    return response.data;
  }

  static async getRoundGames(roundId: number): Promise<ApiResponse<Game[]>> {
    const response = await api.get(`/api/rounds/${roundId}/games`);
    return response.data;
  }

  static async isRoundOpen(roundId: number): Promise<ApiResponse<{ is_open: boolean }>> {
    const response = await api.get(`/api/rounds/${roundId}/is-open`);
    return response.data;
  }

  // Tips
  static async submitTips(
    userId: number, 
    tips: TipSubmission[], 
    tipForUser?: string
  ): Promise<ApiResponse<any>> {
    const response = await api.post('/api/tips', {
      user_id: userId,
      tips,
      tip_for_user: tipForUser,
    });
    return response.data;
  }

  static async getUserRoundTips(userId: number, roundId: number): Promise<ApiResponse<Tip[]>> {
    const response = await api.get(`/api/tips/user/${userId}/round/${roundId}`);
    return response.data;
  }

  static async getAllUserTips(userId: number, year?: number): Promise<ApiResponse<Tip[]>> {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/api/tips/user/${userId}${params}`);
    return response.data;
  }

  static async getRoundTips(roundId: number): Promise<ApiResponse<Tip[]>> {
    const response = await api.get(`/api/tips/round/${roundId}`);
    return response.data;
  }

  // Ladder
  static async getLadder(year: number): Promise<ApiResponse<LadderResponse>> {
    const response = await api.get(`/api/ladder/${year}`);
    return response.data;
  }

  static async getUserLadderPosition(userId: number, year: number): Promise<ApiResponse<any>> {
    const response = await api.get(`/api/ladder/${year}/user/${userId}`);
    return response.data;
  }

  static async getFamilyGroupStandings(year: number): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/api/ladder/${year}/family-groups`);
    return response.data;
  }

  static async getUserPerformance(userId: number, year: number): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/api/ladder/${year}/user/${userId}/performance`);
    return response.data;
  }

  static async getUserStreaks(userId: number, year: number): Promise<ApiResponse<any>> {
    const response = await api.get(`/api/ladder/${year}/user/${userId}/streaks`);
    return response.data;
  }

  // Margin Predictions (Finals Rounds)
  static async getFinalsConfig(roundNumber: number): Promise<ApiResponse<FinalsConfig>> {
    const response = await api.get(`/api/tips/finals-config/${roundNumber}`);
    return response.data;
  }

  static async isMarginGame(gameId: number, roundNumber: number): Promise<ApiResponse<{ is_margin_game: boolean }>> {
    const response = await api.get(`/api/tips/margin-game/${gameId}/${roundNumber}`);
    return response.data;
  }

  static async updateMarginPredictions(gameId: number): Promise<ApiResponse<any>> {
    const response = await api.post(`/api/tips/game/${gameId}/update-margins`);
    return response.data;
  }

  static async calculateMarginRoundWinner(roundId: number): Promise<ApiResponse<any>> {
    const response = await api.post(`/api/tips/round/${roundId}/calculate-margin-winner`);
    return response.data;
  }

  static async getRoundWinners(roundId: number): Promise<ApiResponse<RoundWinner[]>> {
    const response = await api.get(`/api/tips/round/${roundId}/winners`);
    return response.data;
  }

  // Admin functions
  static async updateSquiggleData(year: number): Promise<ApiResponse<any>> {
    const response = await api.post(`/api/squiggle/update/${year}`);
    return response.data;
  }

  static async updateTeams(): Promise<ApiResponse<any>> {
    const response = await api.post('/api/squiggle/update-teams');
    return response.data;
  }
}

export default ApiService;