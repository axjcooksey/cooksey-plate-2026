import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useRoundGames, useUserRoundTips, useRounds, useUsersCanTipFor } from '../hooks/useApi';
import { formatDate, getRoundDisplayName, isFinalsRound, isMarginGame, validateMarginPrediction, getMarginPredictionLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCountdown } from '../hooks/useCountdown';
import { ApiService } from '../services/api';
import type { TipSubmission } from '../types/api';

export default function TippingPage() {
  const { currentUser, currentRound, currentYear } = useApp();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [selectedTipsterUserId, setSelectedTipsterUserId] = useState<number | null>(null);
  const [submittingTips, setSubmittingTips] = useState<Record<number, boolean>>({});
  const [marginPredictions, setMarginPredictions] = useState<Record<number, number>>({});
  const [marginErrors, setMarginErrors] = useState<Record<number, string>>({});
  const [pendingTips, setPendingTips] = useState<Record<number, string>>({});
  const [savedTips, setSavedTips] = useState<Record<number, string>>({});
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [allTipsSubmitted, setAllTipsSubmitted] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use selected round or default to current round
  const activeRoundId = selectedRoundId || currentRound?.id || null;
  
  const { data: rounds } = useRounds(currentYear);
  const { data: games, loading: gamesLoading } = useRoundGames(activeRoundId);
  // Determine which user's tips to fetch (selected tipster or current user)
  const effectiveTipsterUserId = selectedTipsterUserId || currentUser?.id || null;
  const { data: userTips, loading: tipsLoading, refetch: refetchTips } = useUserRoundTips(
    effectiveTipsterUserId, 
    activeRoundId
  );
  const { data: usersCanTipFor } = useUsersCanTipFor(currentUser?.id || null);
  
  // Find the currently selected round data
  const selectedRound = rounds?.find(r => r.id === activeRoundId) || currentRound;
  
  // Clear saved tips when switching rounds or users
  useEffect(() => {
    setSavedTips({});
    setPendingTips({});
    setMarginPredictions({});
    setMarginErrors({});
    setAllTipsSubmitted(false); // Reset submission status when switching context
  }, [activeRoundId, selectedTipsterUserId]);
  
  // Find first game time for countdown - memoized to prevent infinite useEffect loops
  const firstGameTime = useMemo(() => {
    if (!games || games.length === 0) return null;
    
    return games.reduce((earliest, game) => {
      const gameTime = new Date(game.start_time);
      return !earliest || gameTime < earliest ? gameTime : earliest;
    }, null as Date | null);
  }, [games]);
  
  // Always call useCountdown hook early (pass null if no first game time)
  const countdown = useCountdown(firstGameTime);

  // Auto-save function (must be defined before conditional returns)
  const autoSaveTips = useCallback(async () => {
    if (!games || !currentUser || Object.keys(pendingTips).length === 0) return;
    
    setIsAutoSaving(true);
    
    try {
      const tipSubmissions: TipSubmission[] = [];
      let hasValidationErrors = false;

      // Build tip submissions from pending tips
      for (const game of games) {
        const selectedTeam = pendingTips[game.id];
        if (!selectedTeam) continue; // Skip games without pending tips
        
        const tipSubmission: TipSubmission = {
          game_id: game.id,
          squiggle_game_key: game.squiggle_game_key,
          selected_team: selectedTeam,
        };
        
        // Add margin prediction if this is a finals round margin game
        if (selectedRound && isFinalsRound(selectedRound.round_number) && 
            isMarginGame(game, games || [], selectedRound.round_number)) {
          const marginPrediction = marginPredictions[game.id];
          if (marginPrediction !== undefined) {
            const validation = validateMarginPrediction(marginPrediction);
            if (!validation.isValid) {
              hasValidationErrors = true;
              continue;
            }
            tipSubmission.margin_prediction = marginPrediction;
            tipSubmission.is_margin_game = true;
          }
        }
        
        tipSubmissions.push(tipSubmission);
      }

      if (hasValidationErrors || tipSubmissions.length === 0) {
        return; // Don't auto-save if there are validation errors or no tips
      }

      // Determine if we're tipping for someone else
      const selectedTipster = usersCanTipFor?.find(user => user.id === selectedTipsterUserId);
      const tipForUserName = selectedTipster && selectedTipster.id !== currentUser?.id ? selectedTipster.name : undefined;
      
      // Submit tips via API
      await ApiService.submitTips(currentUser.id, tipSubmissions, tipForUserName);
      
      // Clear only the auto-saved tips from pending
      const autoSavedGameIds = tipSubmissions.map(tip => tip.game_id);
      setPendingTips(prev => {
        const updated = { ...prev };
        autoSavedGameIds.forEach(gameId => delete updated[gameId]);
        return updated;
      });
      
      setLastAutoSave(new Date());
      refetchTips();
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [games, currentUser, pendingTips, marginPredictions, selectedRound, usersCanTipFor, selectedTipsterUserId, refetchTips]);

  // Auto-save on window close/unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (Object.keys(pendingTips).length > 0) {
        // Attempt to save before unload
        autoSaveTips();
        
        // Show confirmation dialog if there are unsaved changes
        event.preventDefault();
        event.returnValue = 'You have unsaved tips. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    const handleUnload = () => {
      if (Object.keys(pendingTips).length > 0) {
        autoSaveTips();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [pendingTips, autoSaveTips]);
  
  // Navigation functions
  const goToPreviousRound = () => {
    if (!rounds || !selectedRound) return;
    const currentIndex = rounds.findIndex(r => r.id === selectedRound.id);
    if (currentIndex > 0) {
      setSelectedRoundId(rounds[currentIndex - 1].id);
    }
  };
  
  const goToNextRound = () => {
    if (!rounds || !selectedRound) return;
    const currentIndex = rounds.findIndex(r => r.id === selectedRound.id);
    if (currentIndex < rounds.length - 1) {
      setSelectedRoundId(rounds[currentIndex + 1].id);
    }
  };
  
  // Helper functions
  const canGoToPrevious = () => {
    if (!rounds || !selectedRound) return false;
    const currentIndex = rounds.findIndex(r => r.id === selectedRound.id);
    return currentIndex > 0;
  };
  
  const canGoToNext = () => {
    if (!rounds || !selectedRound) return false;
    const currentIndex = rounds.findIndex(r => r.id === selectedRound.id);
    return currentIndex < rounds.length - 1;
  };

  if (!currentUser || !selectedRound) {
    return <LoadingSpinner text="Loading user data..." />;
  }

  if (gamesLoading || tipsLoading) {
    return <LoadingSpinner text="Loading round games..." />;
  }


  const handleTipSelection = async (gameId: number, selectedTeam: string, marginPrediction?: number) => {
    // Check if this is actually a new/different tip selection
    const currentTip = allTips[gameId];
    const currentMargin = marginPredictions[gameId] ?? existingMarginPredictions[gameId];
    const isNewTipSelection = currentTip !== selectedTeam || 
                             (marginPrediction !== undefined && currentMargin !== marginPrediction);
    
    // Store the tip selection locally first for immediate UI feedback
    setPendingTips(prev => ({ ...prev, [gameId]: selectedTeam }));
    
    // Store margin prediction if applicable
    if (marginPrediction !== undefined) {
      setMarginPredictions(prev => ({ ...prev, [gameId]: marginPrediction }));
    }
    
    // Clear any previous margin errors
    setMarginErrors(prev => ({ ...prev, [gameId]: '' }));
    
    // Only reset submission status when making genuinely new selections
    if (isNewTipSelection) {
      setAllTipsSubmitted(false);
    }
    
    // Auto-save this specific tip immediately
    await autoSaveSingleTip(gameId, selectedTeam, marginPrediction);
  };

  // Auto-save a single tip immediately
  const autoSaveSingleTip = async (gameId: number, selectedTeam: string, marginPrediction?: number) => {
    if (!games || !currentUser) return;
    
    setIsAutoSaving(true);
    
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return;
      
      const tipSubmission: TipSubmission = {
        game_id: gameId,
        squiggle_game_key: game.squiggle_game_key,
        selected_team: selectedTeam,
      };
      
      // Add margin prediction if this is a finals round margin game
      if (selectedRound && isFinalsRound(selectedRound.round_number) && 
          isMarginGame(game, games || [], selectedRound.round_number)) {
        if (marginPrediction !== undefined) {
          const validation = validateMarginPrediction(marginPrediction);
          if (!validation.isValid) {
            setMarginErrors(prev => ({ ...prev, [gameId]: validation.error || 'Invalid margin' }));
            return;
          }
          tipSubmission.margin_prediction = marginPrediction;
          tipSubmission.is_margin_game = true;
        }
      }

      // Determine if we're tipping for someone else
      const selectedTipster = usersCanTipFor?.find(user => user.id === selectedTipsterUserId);
      const tipForUserName = selectedTipster && selectedTipster.id !== currentUser?.id ? selectedTipster.name : undefined;
      
      // Submit tip via API
      await ApiService.submitTips(currentUser.id, [tipSubmission], tipForUserName);
      
      // Move this tip from pending to saved to maintain visibility
      setSavedTips(prev => ({ ...prev, [gameId]: selectedTeam }));
      setPendingTips(prev => {
        const updated = { ...prev };
        delete updated[gameId];
        return updated;
      });
      
      setLastAutoSave(new Date());
      // Don't refetch tips to avoid page scrolling and state reset
      // The tip will be reflected in the backend for other users
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Tip is already stored as pending from the initial handleTipSelection call
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleSubmitAllTips = async () => {
    if (!games || !currentUser) return;
    
    setIsSubmittingAll(true);
    
    try {
      const tipSubmissions: TipSubmission[] = [];
      let hasValidationErrors = false;

      // Build tip submissions from pending tips
      for (const game of games) {
        const selectedTeam = pendingTips[game.id] || existingTips[game.id];
        if (!selectedTeam) continue; // Skip games without tips
        
        const tipSubmission: TipSubmission = {
          game_id: game.id,
          squiggle_game_key: game.squiggle_game_key,
          selected_team: selectedTeam,
        };
        
        // Add margin prediction if this is a finals round margin game
        if (selectedRound && isFinalsRound(selectedRound.round_number) && 
            isMarginGame(game, games || [], selectedRound.round_number)) {
          const marginPrediction = marginPredictions[game.id];
          if (marginPrediction !== undefined) {
            const validation = validateMarginPrediction(marginPrediction);
            if (!validation.isValid) {
              setMarginErrors(prev => ({ ...prev, [game.id]: validation.error || 'Invalid margin' }));
              hasValidationErrors = true;
              continue;
            }
            tipSubmission.margin_prediction = marginPrediction;
            tipSubmission.is_margin_game = true;
          }
        }
        
        tipSubmissions.push(tipSubmission);
      }

      if (hasValidationErrors) {
        return; // Don't submit if there are validation errors
      }

      if (tipSubmissions.length === 0) {
        return; // No tips to submit
      }

      // Determine if we're tipping for someone else
      const selectedTipster = usersCanTipFor?.find(user => user.id === selectedTipsterUserId);
      const tipForUserName = selectedTipster && selectedTipster.id !== currentUser?.id ? selectedTipster.name : undefined;
      
      // Submit all tips via API
      await ApiService.submitTips(currentUser.id, tipSubmissions, tipForUserName);
      
      // Clear only the submitted tips from pending
      const submittedGameIds = tipSubmissions.map(tip => tip.game_id);
      setPendingTips(prev => {
        const updated = { ...prev };
        submittedGameIds.forEach(gameId => delete updated[gameId]);
        return updated;
      });
      setAllTipsSubmitted(true);
      
      // Don't refetch tips to avoid page scrolling
      // Tips are already managed locally via auto-save and state
    } catch (error) {
      console.error('Failed to submit tips:', error);
    } finally {
      setIsSubmittingAll(false);
    }
  };

  // Handle margin prediction input changes
  const handleMarginChange = (gameId: number, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setMarginPredictions(prev => ({ ...prev, [gameId]: numValue }));
    
    // Clear previous error
    setMarginErrors(prev => ({ ...prev, [gameId]: '' }));
  };

  const existingTips = userTips?.reduce((acc, tip) => {
    acc[tip.game_id] = tip.selected_team;
    return acc;
  }, {} as Record<number, string>) || {};

  // Combine existing tips with saved tips and pending tips (pending takes priority)
  const allTips = { ...existingTips, ...savedTips, ...pendingTips };

  const existingMarginPredictions = userTips?.reduce((acc, tip) => {
    if (tip.margin_prediction !== undefined && tip.margin_prediction !== null) {
      acc[tip.game_id] = tip.margin_prediction;
    }
    return acc;
  }, {} as Record<number, number>) || {};

  // Use complex lockout logic instead of simple round status
  const isRoundFullyLocked = selectedRound.status === 'completed';
  
  // Calculate tip results for completed rounds
  const getTipResult = (game: any, userTip: string) => {
    if (selectedRound.status !== 'completed' || !userTip) return null;
    // This would need to check against actual game results
    // For now, we'll use game.winning_team if available
    return game.winning_team === userTip;
  };
  
  // Complex lockout logic implementation
  const canSubmitTip = (game: any) => {
    const now = new Date();
    const gameStartTime = new Date(game.start_time);
    
    // 1. Game-specific lockout (always enforced)
    if (gameStartTime <= now || (game.complete && game.complete > 0)) {
      return false; // Game has started or finished
    }
    
    // 2. Round commitment lockout
    const hasSubmittedTips = userTips && userTips.length > 0;
    const roundFirstGameTime = selectedRound.first_game_time ? new Date(selectedRound.first_game_time) : null;
    const roundHasStarted = roundFirstGameTime && roundFirstGameTime <= now;
    
    if (hasSubmittedTips && roundHasStarted) {
      return false; // User committed tips before round started - all locked
    }
    
    // 3. Otherwise, user can submit tip
    return true;
  };
  
  // Get button styling based on game state and tip results
  const getButtonStyling = (game: any, teamName: string, isUserTip: boolean) => {
    const now = new Date();
    const gameStartTime = new Date(game.start_time);
    const gameComplete = game.complete || 0;
    const gameWinner = game.winning_team;
    
    // Game finished - show results
    if (gameComplete === 100) {
      if (isUserTip) {
        return teamName === gameWinner ? 'green-glow' : 'red-glow';
      }
      return 'grey-unavailable';
    }
    
    // Game in progress - show current winner with green glow
    if (gameComplete > 0 && gameWinner) {
      if (teamName === gameWinner) {
        return 'green-glow'; // Winning team
      }
      if (isUserTip && teamName !== gameWinner) {
        return 'blue-glow'; // User's tip (not winning)
      }
    }
    
    // Game not started - show user selection with blue glow
    if (gameStartTime > now && isUserTip) {
      return 'blue-glow'; // User's tip
    }
    
    // Game started but no tip submitted - grey
    if (gameStartTime <= now && !isUserTip) {
      return 'grey-unavailable';
    }
    
    return 'default'; // Available for selection
  };
  
  // Get CSS classes for button styling
  const getButtonClasses = (stylingType: string, isDisabled: boolean) => {
    const baseClasses = 'p-4 rounded-lg border-2 transition-all text-left relative';
    
    switch (stylingType) {
      case 'green-glow':
        return `${baseClasses} border-green-500 bg-green-50 shadow-green-200 shadow-lg`;
      case 'red-glow':  
        return `${baseClasses} border-red-500 bg-red-50 shadow-red-200 shadow-lg`;
      case 'blue-glow':
        return `${baseClasses} border-blue-500 bg-blue-50 shadow-blue-200 shadow-lg`;
      case 'grey-unavailable':
        return `${baseClasses} border-gray-300 bg-gray-100 opacity-60`;
      default:
        return `${baseClasses} border-gray-200 hover:border-gray-300`;
    }
  };
  
  // Count correct tips for completed rounds
  const getCorrectTipsCount = () => {
    if (selectedRound.status !== 'completed' || !games || !userTips) return null;
    
    const correctCount = games.reduce((count, game) => {
      const userTip = existingTips[game.id];
      if (userTip && game.winning_team === userTip) {
        return count + 1;
      }
      return count;
    }, 0);
    
    return { correct: correctCount, total: games.length };
  };
  
  // Count correct tips for active/current rounds (includes in-progress games)
  const getCurrentCorrectTipsCount = () => {
    if (!games || !userTips) return null;
    
    let correctCount = 0;
    let totalWithResults = 0;
    
    games.forEach(game => {
      const userTip = existingTips[game.id];
      // Only count games with results (complete > 0 and has winning_team)
      if (game.complete > 0 && game.winning_team) {
        totalWithResults++;
        if (userTip && game.winning_team === userTip) {
          correctCount++;
        }
      }
    });
    
    return totalWithResults > 0 ? { correct: correctCount, total: totalWithResults } : null;
  };
  
  const tipsScore = getCorrectTipsCount();
  const currentTipsScore = getCurrentCorrectTipsCount();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Reorganized Round Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          {/* Left Side - Countdown Timer */}
          <div className="flex items-center min-w-0 flex-1">
            {firstGameTime && !countdown.isExpired && (
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border">
                <div className="text-sm text-gray-600">First game starts in:</div>
                <div className="font-mono font-bold text-red-600">
                  {countdown.days > 0 && (
                    <span>{countdown.days}d </span>
                  )}
                  {String(countdown.hours).padStart(2, '0')}:
                  {String(countdown.minutes).padStart(2, '0')}:
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
              </div>
            )}
            
            {firstGameTime && countdown.isExpired && selectedRound.status === 'active' && (
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="text-sm text-green-800 font-medium">Round has started!</div>
              </div>
            )}
          </div>
          
          {/* Center - Round Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousRound}
              disabled={!canGoToPrevious()}
              className={`
                p-2 rounded-lg border transition-colors
                ${canGoToPrevious() 
                  ? 'border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Previous Round"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">
              {getRoundDisplayName(selectedRound)} Tips
            </h2>
            
            <button
              onClick={goToNextRound}
              disabled={!canGoToNext()}
              className={`
                p-2 rounded-lg border transition-colors
                ${canGoToNext() 
                  ? 'border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Next Round"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Right Side - Status and Tips Score */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 justify-end">
            {/* Current Tips Score for Active Rounds */}
            {currentTipsScore && selectedRound.status === 'active' && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-700">Correct so far:</div>
                <div className="text-sm font-bold text-blue-800">
                  {currentTipsScore.correct}/{currentTipsScore.total}
                </div>
              </div>
            )}
            
            {/* Completed Round Tips Score */}
            {tipsScore && selectedRound.status === 'completed' && (
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Final score:</div>
                <div className="text-sm font-bold text-gray-800">
                  {tipsScore.correct}/{tipsScore.total}
                </div>
              </div>
            )}
            
            <span className={`
              px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap
              ${selectedRound.status === 'upcoming' ? 'bg-green-100 text-green-800' : ''}
              ${selectedRound.status === 'active' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${selectedRound.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {selectedRound.status === 'upcoming' && 'Open for Tips'}
              {selectedRound.status === 'active' && 'In Progress'}
              {selectedRound.status === 'completed' && 'Round Complete'}
            </span>
          </div>
        </div>
      </div>

      {/* Family Tipping Selector */}
      {usersCanTipFor && usersCanTipFor.length > 1 && !currentUser?.family_group_name?.includes('Individual') && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-gray-900">
                Select user to enter tips on their behalf:
              </p>
              <div className="flex items-center space-x-4">
                <div className="min-w-48">
                  <select
                    value={selectedTipsterUserId || currentUser?.id || ''}
                    onChange={(e) => setSelectedTipsterUserId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {usersCanTipFor.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.id === currentUser?.id && '(You)'}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTipsterUserId && selectedTipsterUserId !== currentUser?.id && (
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                    <span className="text-sm text-blue-700 font-medium">
                      Entering tips for: {usersCanTipFor.find(u => u.id === selectedTipsterUserId)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lockout Status Section */}
      {(() => {
        const now = new Date();
        const hasSubmittedTips = userTips && userTips.length > 0;
        const roundFirstGameTime = selectedRound.first_game_time ? new Date(selectedRound.first_game_time) : null;
        const roundHasStarted = roundFirstGameTime && roundFirstGameTime <= now;
        const availableGames = games?.filter(game => canSubmitTip(game)).length || 0;
        
        if (selectedRound.status === 'completed') {
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800">
                This round is completed. All results are final.
              </p>
            </div>
          );
        }
        
        if (hasSubmittedTips && roundHasStarted) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                You submitted tips before this round started. All tips are now locked and cannot be changed.
              </p>
            </div>
          );
        }
        
        if (!hasSubmittedTips && roundHasStarted && availableGames > 0) {
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                You can still submit tips for {availableGames} game{availableGames !== 1 ? 's' : ''} that haven't started yet.
              </p>
            </div>
          );
        }
        
        if (!hasSubmittedTips && roundHasStarted && availableGames === 0 && selectedRound.status === 'active') {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                All games in this round have started. No tips can be submitted.
              </p>
            </div>
          );
        }
        
        return null;
      })()}

      <div className="space-y-4">
        {games?.map((game: any) => {
          const userTip = allTips[game.id];
          const isSubmitting = submittingTips[game.id];
          const tipResult = getTipResult(game, userTip);
          const canSubmitForThisGame = canSubmitTip(game);
          
          return (
            <div key={game.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {formatDate(game.start_time, 'EEE dd/MM HH:mm')} • {game.venue}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Game {game.id}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team */}
                {(() => {
                  const isUserTip = userTip === game.home_team;
                  const stylingType = getButtonStyling(game, game.home_team, isUserTip);
                  const isDisabled = !canSubmitForThisGame || isSubmitting;
                  
                  return (
                    <button
                      onClick={() => {
                        if (canSubmitForThisGame) {
                          const marginRequired = selectedRound && isFinalsRound(selectedRound.round_number) && 
                                               isMarginGame(game, games || [], selectedRound.round_number);
                          const margin = marginRequired ? (marginPredictions[game.id] || existingMarginPredictions[game.id]) : undefined;
                          handleTipSelection(game.id, game.home_team, margin);
                        }
                      }}
                      disabled={isDisabled}
                      className={`
                        ${getButtonClasses(stylingType, isDisabled)}
                        ${!canSubmitForThisGame ? 'cursor-not-allowed' : 'cursor-pointer'}
                        ${isSubmitting ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{game.home_team}</div>
                          <div className="text-sm text-gray-600">Home</div>
                        </div>
                        {isUserTip && (
                          <div className={`
                            ${stylingType === 'green-glow' ? 'text-green-600' : 
                              stylingType === 'red-glow' ? 'text-red-600' : 'text-blue-600'}
                          `}>
                            {stylingType === 'green-glow' ? '✓' : stylingType === 'red-glow' ? '✗' : '✓'}
                          </div>
                        )}
                        {!isUserTip && stylingType === 'green-glow' && (
                          <div className="text-green-600">👑</div>
                        )}
                      </div>
                    </button>
                  );
                })()}

                {/* Away Team */}
                {(() => {
                  const isUserTip = userTip === game.away_team;
                  const stylingType = getButtonStyling(game, game.away_team, isUserTip);
                  const isDisabled = !canSubmitForThisGame || isSubmitting;
                  
                  return (
                    <button
                      onClick={() => {
                        if (canSubmitForThisGame) {
                          const marginRequired = selectedRound && isFinalsRound(selectedRound.round_number) && 
                                               isMarginGame(game, games || [], selectedRound.round_number);
                          const margin = marginRequired ? (marginPredictions[game.id] || existingMarginPredictions[game.id]) : undefined;
                          handleTipSelection(game.id, game.away_team, margin);
                        }
                      }}
                      disabled={isDisabled}
                      className={`
                        ${getButtonClasses(stylingType, isDisabled)}
                        ${!canSubmitForThisGame ? 'cursor-not-allowed' : 'cursor-pointer'}
                        ${isSubmitting ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{game.away_team}</div>
                          <div className="text-sm text-gray-600">Away</div>
                        </div>
                        {isUserTip && (
                          <div className={`
                            ${stylingType === 'green-glow' ? 'text-green-600' : 
                              stylingType === 'red-glow' ? 'text-red-600' : 'text-blue-600'}
                          `}>
                            {stylingType === 'green-glow' ? '✓' : stylingType === 'red-glow' ? '✗' : '✓'}
                          </div>
                        )}
                        {!isUserTip && stylingType === 'green-glow' && (
                          <div className="text-green-600">👑</div>
                        )}
                      </div>
                    </button>
                  );
                })()}
              </div>

              {/* Margin Prediction Input for Finals Rounds */}
              {(() => {
                const requiresMargin = selectedRound && isFinalsRound(selectedRound.round_number) && 
                                     isMarginGame(game, games || [], selectedRound.round_number);
                const existingMargin = existingMarginPredictions[game.id];
                const currentMargin = marginPredictions[game.id] ?? existingMargin ?? '';
                const marginError = marginErrors[game.id];
                
                if (!requiresMargin) return null;
                
                return (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-yellow-800 mb-1">
                        {getMarginPredictionLabel(selectedRound.round_number)}
                      </h4>
                      <p className="text-sm text-yellow-700">
                        This is the last game of {getRoundDisplayName(selectedRound)}. 
                        Predict the winning margin to compete for the round win!
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <label className="text-sm font-medium text-yellow-800">
                        Winning margin (points):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={currentMargin}
                        onChange={(e) => handleMarginChange(game.id, e.target.value)}
                        disabled={!canSubmitForThisGame}
                        className={`
                          w-20 px-3 py-1 border rounded-md text-center
                          ${marginError ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-white'}
                          ${!canSubmitForThisGame ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                        placeholder="0"
                      />
                      <span className="text-sm text-yellow-700">points</span>
                    </div>
                    
                    {marginError && (
                      <div className="mt-2 text-sm text-red-600">
                        {marginError}
                      </div>
                    )}
                    
                    {existingMargin && !marginError && (
                      <div className="mt-2 text-sm text-yellow-700">
                        Current prediction: {existingMargin} points
                      </div>
                    )}
                  </div>
                );
              })()}

              {isSubmitting && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Submitting tip...
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(!games || games.length === 0) && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">No games available</h3>
            <p>There are no games scheduled for this round yet.</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {games && games.length > 0 && selectedRound.status !== 'completed' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center space-y-3">
            {/* Auto-save status */}
            {(isAutoSaving || lastAutoSave || Object.keys(pendingTips).length > 0) && (
              <div className="text-sm text-gray-600 flex items-center">
                {isAutoSaving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                    Auto-saving...
                  </div>
                ) : lastAutoSave ? (
                  <div className="flex items-center text-green-600">
                    <span className="mr-1">✓</span>
                    Auto-saved at {lastAutoSave.toLocaleTimeString()}
                  </div>
                ) : Object.keys(pendingTips).length > 0 ? (
                  <div className="text-orange-600">
                    You have unsaved changes...
                  </div>
                ) : null}
              </div>
            )}
            
            <button
              onClick={handleSubmitAllTips}
              disabled={isSubmittingAll || isAutoSaving || Object.keys(allTips).length === 0}
              className={`
                px-8 py-3 rounded-lg font-medium text-white transition-all
                ${allTipsSubmitted 
                  ? 'bg-red-300 cursor-default' 
                  : isAutoSaving 
                    ? 'bg-red-400 cursor-default'
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                }
                ${(isSubmittingAll || isAutoSaving || Object.keys(allTips).length === 0) && !allTipsSubmitted 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
                }
              `}
            >
              {isSubmittingAll ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : isAutoSaving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : allTipsSubmitted ? (
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  Tips Submitted
                </div>
              ) : Object.keys(pendingTips).length > 0 ? (
                'Submit All Tips'
              ) : (
                'Submit Tips'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}