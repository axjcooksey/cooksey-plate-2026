import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { ApiResponse } from '../types/api';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Network error',
      });
    }
  };

  useEffect(() => {
    refetch();
  }, dependencies);

  return { ...state, refetch };
}

// Specific hooks for common API calls
export function useUsers() {
  return useApi(() => ApiService.getUsers());
}

export function useUser(userId: number | null) {
  return useApi(
    () => ApiService.getUserById(userId!),
    [userId]
  );
}

export function useUserByName(name: string | null) {
  return useApi(
    () => ApiService.getUserByName(name!),
    [name]
  );
}

export function useFamilyGroups() {
  return useApi(() => ApiService.getFamilyGroups());
}

export function useTeams() {
  return useApi(() => ApiService.getTeams());
}

export function useCurrentRound(year: number) {
  return useApi(() => ApiService.getCurrentRound(year), [year]);
}

export function useRounds(year: number) {
  return useApi(() => ApiService.getRounds(year), [year]);
}

export function useRoundGames(roundId: number | null) {
  return useApi(
    () => ApiService.getRoundGames(roundId!),
    [roundId]
  );
}

export function useUserRoundTips(userId: number | null, roundId: number | null) {
  return useApi(
    () => ApiService.getUserRoundTips(userId!, roundId!),
    [userId, roundId]
  );
}

export function useRoundTips(roundId: number | null) {
  return useApi(
    () => ApiService.getRoundTips(roundId!),
    [roundId]
  );
}

export function useLadder(year: number) {
  return useApi(() => ApiService.getLadder(year), [year]);
}

export function useUserStats(userId: number | null, year: number) {
  return useApi(
    () => ApiService.getUserStats(userId!, year),
    [userId, year]
  );
}