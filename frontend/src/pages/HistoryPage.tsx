import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useRounds, useRoundTips, useRoundGames, useUsers } from '../hooks/useApi';
import { formatDate, getRoundDisplayName } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import CountdownTimer from '../components/CountdownTimer';
import { calculateLockoutTime } from '../hooks/useCountdown';

export default function HistoryPage() {
  const { currentUser, currentYear, currentRound } = useApp();
  const { data: rounds } = useRounds(currentYear);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const { data: allTips, loading: tipsLoading } = useRoundTips(selectedRound);
  const { data: roundGames, loading: gamesLoading } = useRoundGames(selectedRound);
  const { data: allUsers } = useUsers();

  // Set current round as default when data loads
  React.useEffect(() => {
    if (currentRound && selectedRound === null) {
      setSelectedRound(currentRound.id);
    }
  }, [currentRound, selectedRound]);

  if (!currentUser) {
    return <LoadingSpinner text="Loading user data..." />;
  }

  // Organize rounds by status for dropdown (filter out rounds without games)
  const organizeRoundsByStatus = () => {
    if (!rounds) return { completed: [], active: [], upcoming: [] };
    
    // Filter out rounds that don't have any games
    const roundsWithGames = rounds.filter(round => round.game_count && round.game_count > 0);
    
    const now = new Date();
    return roundsWithGames.reduce((acc, round) => {
      if (round.status === 'completed') {
        acc.completed.push(round);
      } else if (round.status === 'active') {
        acc.active.push(round);
      } else {
        const lockoutTime = round.lockout_time ? new Date(round.lockout_time) : null;
        if (lockoutTime && lockoutTime > now) {
          acc.upcoming.push(round);
        } else {
          acc.active.push(round);
        }
      }
      return acc;
    }, { completed: [] as typeof rounds, active: [] as typeof rounds, upcoming: [] as typeof rounds });
  };

  const { completed: completedRounds, active: activeRounds, upcoming: upcomingRounds } = organizeRoundsByStatus();

  // Create matrix data structure
  const createTipsMatrix = () => {
    if (!roundGames || !allUsers) return { users: [], games: [], matrix: {} };

    // Use all users from the system (not just those who tipped)
    const users = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      family_group: user.family_group_name || user.family_group?.name
    }));

    // Sort games by start time
    const games = [...roundGames].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Create matrix mapping user_id -> game_id -> tip
    const matrix: Record<number, Record<number, any>> = {};
    
    // Initialize matrix with all users and games (empty by default)
    users.forEach(user => {
      matrix[user.id] = {};
      games.forEach(game => {
        matrix[user.id][game.id] = null; // Default no tip
      });
    });

    // Fill in actual tips if they exist
    if (allTips) {
      allTips.forEach(tip => {
        if (matrix[tip.user_id]) {
          matrix[tip.user_id][tip.game_id] = tip;
        }
      });
    }

    return { users, games, matrix };
  };

  const { users, games, matrix } = createTipsMatrix();

  // Check if the selected round is in lockout period
  const isRoundInLockout = () => {
    // Admins can always see tips, regardless of lockout
    if (currentUser?.role === 'admin') return false;
    
    if (!selectedRound || !roundGames || roundGames.length === 0) return false;
    
    const selectedRoundData = rounds?.find(r => r.id === selectedRound);
    if (!selectedRoundData || selectedRoundData.status !== 'upcoming') return false;
    
    // Find the first game time
    const firstGame = roundGames.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0];
    
    if (!firstGame) return false;
    
    const lockoutTime = calculateLockoutTime(firstGame.start_time);
    const now = new Date();
    
    return now < lockoutTime;
  };

  // Check if a specific user's tips should be visible (for privacy feature)
  const shouldShowUserTips = (userId: number) => {
    // Admins can always see all tips
    if (currentUser?.role === 'admin') return true;
    
    // Always show current user's own tips
    if (userId === currentUser?.id) return true;
    
    // If not in lockout, show all tips
    if (!isRoundInLockout()) return true;
    
    // During lockout, only show family group members' tips
    const user = allUsers?.find(u => u.id === userId);
    const currentUserFamilyGroup = currentUser?.family_group_id;
    
    if (!user || !currentUserFamilyGroup) return false;
    
    return user.family_group_id === currentUserFamilyGroup;
  };

  const getLockoutTime = () => {
    if (!roundGames || roundGames.length === 0) return null;
    
    const firstGame = roundGames.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0];
    
    return firstGame ? calculateLockoutTime(firstGame.start_time) : null;
  };

  const roundIsLocked = isRoundInLockout();
  const lockoutTime = getLockoutTime();
  
  // Check if there are any locked (non-family) users in current view
  const hasLockedUsers = roundIsLocked && users.some(user => !shouldShowUserTips(user.id));

  return (
    <div className="space-y-6">

      {/* Round Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Select Round</h2>
          {(tipsLoading || gamesLoading) && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
              Loading...
            </div>
          )}
        </div>
        
        <select
          value={selectedRound || ''}
          onChange={(e) => setSelectedRound(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Choose a round...</option>
          
          {completedRounds.length > 0 && (
            <optgroup label="🟢 Completed Rounds">
              {completedRounds.map(round => (
                <option key={round.id} value={round.id}>
                  {getRoundDisplayName(round)}
                </option>
              ))}
            </optgroup>
          )}
          
          {activeRounds.length > 0 && (
            <optgroup label="🔴 Active Rounds">
              {activeRounds.map(round => (
                <option key={round.id} value={round.id}>
                  {getRoundDisplayName(round)}
                </option>
              ))}
            </optgroup>
          )}
          
          {upcomingRounds.length > 0 && (
            <optgroup label="⏳ Upcoming Rounds">
              {upcomingRounds.map(round => (
                <option key={round.id} value={round.id}>
                  {getRoundDisplayName(round)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Tips Matrix */}
      {selectedRound && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {rounds?.find(r => r.id === selectedRound) ? getRoundDisplayName(rounds.find(r => r.id === selectedRound)!) : 'Round'} Tips Matrix
            </h2>
            <div className="text-sm text-gray-500">
              {users.length} tipsters • {games.length} games
              {!allTips || allTips.length === 0 ? ' • No tips submitted yet' : ` • ${allTips.length} tips submitted`}
            </div>
          </div>

          {/* Lockout Countdown for Upcoming Rounds */}
          {hasLockedUsers && lockoutTime && (
            <div className="mb-6">
              <CountdownTimer 
                targetDate={lockoutTime} 
                label={`All tips will be visible 2 hours before the first game starts`}
              />
            </div>
          )}

          {/* Privacy/Family Info */}
          {hasLockedUsers && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-blue-600 mr-2">👨‍👩‍👧‍👦</div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Family Group Privacy</p>
                  <p className="text-xs text-blue-700">
                    You can see your family group's tips now. Other tipsters' selections will be visible 2 hours before the first game.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Override Indicator */}
          {currentUser?.role === 'admin' && lockoutTime && new Date() < lockoutTime && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-amber-600 mr-2">👑</div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Admin View</p>
                  <p className="text-xs text-amber-700">
                    You're viewing all tips that are normally locked for tipsters until 2 hours before the first game.
                  </p>
                </div>
              </div>
            </div>
          )}

          {games.length > 0 ? (
            <>
              {(!allTips || allTips.length === 0) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-blue-800 text-sm">
                    This shows all tipsters and available games for this round. 
                    Tips will appear here once they're submitted or imported.
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {/* Header Rows */}
                <thead>
                  {/* Teams Row */}
                  <tr>
                    <th rowSpan={2} className="sticky left-0 z-10 bg-gray-50 border border-gray-300 p-3 text-left font-semibold text-gray-900 min-w-[150px]">
                      Tipster
                    </th>
                    {games.map((game) => (
                      <th key={`teams-${game.id}`} className="border border-gray-300 p-2 bg-gray-50 text-center min-w-[120px]">
                        <div className="text-xs font-semibold text-gray-900">
                          {game.home_team}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">vs</div>
                        <div className="text-xs font-semibold text-gray-900">
                          {game.away_team}
                        </div>
                      </th>
                    ))}
                  </tr>
                  
                  {/* Date & Venue Row */}
                  <tr>
                    {games.map((game) => (
                      <th key={`details-${game.id}`} className="border border-gray-300 p-2 bg-gray-50 text-center min-w-[120px]">
                        <div className="text-xs text-gray-500">
                          {formatDate(game.start_time, 'dd/MM HH:mm')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {game.venue}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body Rows */}
                <tbody>
                  {users.map((user) => {
                    const canViewUserTips = shouldShowUserTips(user.id);
                    const isCurrentUser = user.id === currentUser?.id;
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 ${!canViewUserTips ? 'opacity-60' : ''}`}>
                        <td className={`sticky left-0 z-10 border border-gray-300 p-3 font-medium ${
                          !canViewUserTips ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'
                        }`}>
                          <div className="flex items-center">
                            {isCurrentUser && <span className="text-blue-500 mr-1">👤</span>}
                            {user.name}
                            {!canViewUserTips && <span className="ml-2 text-gray-400">🔒</span>}
                          </div>
                        </td>
                        {games.map((game) => {
                          const tip = matrix[user.id]?.[game.id];
                          return (
                            <td key={`${user.id}-${game.id}`} className="border border-gray-300 p-1">
                              {canViewUserTips && tip ? (
                                <div className={`
                                  p-2 rounded text-center text-xs font-medium
                                  ${tip.is_correct === true ? 'bg-green-100 text-green-800 border border-green-300' : 
                                    tip.is_correct === false ? 'bg-red-100 text-red-800 border border-red-300' : 
                                    'bg-blue-40 text-blue-700 border border-blue-200'}
                                `}>
                                  <div className="font-semibold">{tip.selected_team}</div>
                                  {tip.is_correct !== null && (
                                    <div className="mt-1">
                                      {tip.is_correct ? '✓' : '✗'}
                                    </div>
                                  )}
                                </div>
                              ) : !canViewUserTips && tip ? (
                                <div className="p-2 rounded text-center bg-gray-100 border border-gray-300 min-h-[50px] flex items-center justify-center">
                                  <div className="text-gray-400 text-xs">🔒</div>
                                </div>
                              ) : canViewUserTips && !tip ? (
                                <div className="p-2 rounded text-center bg-gray-50 border border-gray-200 min-h-[50px] flex items-center justify-center">
                                  <div className="text-gray-300 text-xs">—</div>
                                </div>
                              ) : (
                                <div className="p-2 rounded text-center bg-gray-100 border border-gray-300 min-h-[50px] flex items-center justify-center">
                                  <div className="text-gray-400 text-xs">—</div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              
              {/* Legend */}
              {games.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Legend:</h3>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                      <span>Correct tip</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span>Incorrect tip</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                      <span>Pending result</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                      <span>No tip submitted</span>
                    </div>
                    {hasLockedUsers && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-400" style={{fontSize: '8px'}}>🔒</div>
                        <span>Tips hidden until 2 hours before game</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">No games found</h3>
                <p>No games are scheduled for this round yet.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedRound && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">👆</div>
            <h3 className="text-lg font-medium mb-2">Select a round above</h3>
            <p>Choose a round to view the tips matrix for all tipsters</p>
          </div>
        </div>
      )}
    </div>
  );
}