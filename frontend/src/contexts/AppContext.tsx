import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Round } from '../types/api';
import { ApiService } from '../services/api';

interface AppContextType {
  // Current user
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Current year and round
  currentYear: number;
  currentRound: Round | null;
  setCurrentRound: (round: Round | null) => void;
  
  // App state
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Utility functions
  isAdmin: boolean;
  canTipForOthers: boolean;
  refreshCurrentRound: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  
  const currentYear = parseInt(import.meta.env.VITE_CURRENT_YEAR || '2025');

  // Computed properties
  const isAdmin = currentUser?.role === 'admin';
  const canTipForOthers = isAdmin || false; // In the future, tipsters can tip for each other

  // Fetch current round when user is set
  const refreshCurrentRound = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await ApiService.getCurrentRound(currentYear);
      if (response.success && response.data) {
        setCurrentRound(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch current round:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshCurrentRound();
    }
  }, [currentUser, currentYear]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cooksey-plate-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('cooksey-plate-user');
      }
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cooksey-plate-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cooksey-plate-user');
    }
  }, [currentUser]);

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    currentYear,
    currentRound,
    setCurrentRound,
    loading,
    setLoading,
    isAdmin,
    canTipForOthers,
    refreshCurrentRound,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;