import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useRoundGames, useUserRoundTips } from '../hooks/useApi';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TippingPage() {
  const { currentUser, currentRound } = useApp();
  const { data: games, loading: gamesLoading } = useRoundGames(currentRound?.id || null);
  const { data: userTips, loading: tipsLoading, refetch: refetchTips } = useUserRoundTips(
    currentUser?.id || null, 
    currentRound?.id || null
  );
  const [submittingTips, setSubmittingTips] = useState<Record<number, boolean>>({});

  if (!currentUser || !currentRound) {
    return <LoadingSpinner text="Loading user data..." />;
  }

  if (gamesLoading || tipsLoading) {
    return <LoadingSpinner text="Loading round games..." />;
  }

  const handleTipSubmission = async (gameId: number, teamId: number) => {
    setSubmittingTips(prev => ({ ...prev, [gameId]: true }));
    
    try {
      // API call would go here
      console.log(`Submitting tip for game ${gameId}, team ${teamId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh tips data
      refetchTips();
    } catch (error) {
      console.error('Failed to submit tip:', error);
    } finally {
      setSubmittingTips(prev => ({ ...prev, [gameId]: false }));
    }
  };

  const existingTips = userTips?.reduce((acc, tip) => {
    acc[tip.game_id] = tip.selected_team;
    return acc;
  }, {} as Record<number, string>) || {};

  const isRoundLocked = currentRound.status !== 'upcoming';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Round {currentRound.round_number} Tips
          </h2>
          <span className={`
            px-3 py-1 text-sm font-medium rounded-full
            ${currentRound.status === 'upcoming' ? 'bg-green-100 text-green-800' : ''}
            ${currentRound.status === 'active' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${currentRound.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {currentRound.status === 'upcoming' && 'Open for Tips'}
            {currentRound.status === 'active' && 'In Progress'}
            {currentRound.status === 'completed' && 'Completed'}
          </span>
        </div>

        {currentRound.lockout_time && (
          <p className="text-sm text-gray-600 mb-6">
            Round locks: {formatDate(currentRound.lockout_time, 'dd/MM/yyyy HH:mm')}
          </p>
        )}

        {isRoundLocked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-800">
              This round is {currentRound.status}. Tips can no longer be submitted or changed.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {games?.map((game: any) => {
          const userTip = existingTips[game.id];
          const isSubmitting = submittingTips[game.id];
          
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
                <button
                  onClick={() => !isRoundLocked && handleTipSubmission(game.id, game.home_team)}
                  disabled={isRoundLocked || isSubmitting}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${userTip === game.home_team 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${isRoundLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                    ${isSubmitting ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{game.home_team}</div>
                      <div className="text-sm text-gray-600">Home</div>
                    </div>
                    {userTip === game.home_team && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </div>
                </button>

                {/* Away Team */}
                <button
                  onClick={() => !isRoundLocked && handleTipSubmission(game.id, game.away_team)}
                  disabled={isRoundLocked || isSubmitting}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${userTip === game.away_team 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${isRoundLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                    ${isSubmitting ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{game.away_team}</div>
                      <div className="text-sm text-gray-600">Away</div>
                    </div>
                    {userTip === game.away_team && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </div>
                </button>
              </div>

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
    </div>
  );
}