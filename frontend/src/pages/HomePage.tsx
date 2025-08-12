
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLadder, useUserStats, useRoundGames, useUserRoundTips } from '../hooks/useApi';
import { formatDate, getRankDisplay, formatPercentage } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const { currentUser, currentRound, currentYear } = useApp();
  const { data: ladder } = useLadder(currentYear);
  const { data: userStats } = useUserStats(currentUser?.id || null, currentYear);
  const { data: roundGames } = useRoundGames(currentRound?.id || null);
  const { data: userTips } = useUserRoundTips(currentUser?.id || null, currentRound?.id || null);

  if (!currentUser || !currentRound) {
    return <LoadingSpinner />;
  }

  const userPosition = ladder?.ladder.find(entry => entry.user_id === currentUser.id);
  const totalGames = roundGames?.length || 0;
  const userTipsCount = userTips?.length || 0;
  const tipsRemaining = totalGames - userTipsCount;

  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ladder Position */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">🏆</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Ladder Position</div>
              <div className="text-3xl font-bold text-gray-900">
                {userPosition ? getRankDisplay(userPosition.rank) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Tips This Season */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">📋</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tips This Season</div>
              <div className="text-3xl font-bold text-gray-900">
                {userStats?.total_tips || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">🎯</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Accuracy</div>
              <div className="text-3xl font-bold text-success-600">
                {userStats?.percentage ? formatPercentage(userStats.percentage) : '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* Correct Tips */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">✅</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Correct Tips</div>
              <div className="text-3xl font-bold text-gray-900">
                {userStats?.correct_tips || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Round Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Round {currentRound.round_number} Status
          </h3>
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${currentRound.status === 'upcoming' ? 'bg-gray-100 text-gray-800' : ''}
            ${currentRound.status === 'active' ? 'bg-green-100 text-green-800' : ''}
            ${currentRound.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
          `}>
            {currentRound.status.charAt(0).toUpperCase() + currentRound.status.slice(1)}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Your tips submitted:</span>
            <span className="font-medium">
              {userTipsCount} of {totalGames}
            </span>
          </div>
          
          {tipsRemaining > 0 && currentRound.status === 'upcoming' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tips remaining:</span>
              <span className="font-medium text-red-600">
                {tipsRemaining}
              </span>
            </div>
          )}

          {currentRound.lockout_time && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Round locks:</span>
              <span className="font-medium">
                {formatDate(currentRound.lockout_time, 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>

        {tipsRemaining > 0 && currentRound.status === 'upcoming' && (
          <div className="mt-4">
            <Link
              to="/tipping"
              className="w-full bg-gradient-to-r from-lovable-500 to-lovable-600 hover:from-lovable-600 hover:to-lovable-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md inline-block text-center"
            >
              Complete Your Tips ({tipsRemaining} remaining)
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/tipping"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Make Tips</h3>
            <p className="text-sm text-gray-600">Submit your Round {currentRound.round_number} tips</p>
          </div>
        </Link>

        <Link
          to="/ladder"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">View Ladder</h3>
            <p className="text-sm text-gray-600">See current standings</p>
          </div>
        </Link>

        <Link
          to="/history"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">All Tips</h3>
            <p className="text-sm text-gray-600">View all family tips by round</p>
          </div>
        </Link>
      </div>
    </div>
  );
}