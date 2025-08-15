
import { useApp } from '../contexts/AppContext';
import { useLadder, useUsers } from '../hooks/useApi';
import { getRankDisplay, formatPercentage } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LadderPage() {
  const { currentYear, currentUser } = useApp();
  const { data: ladder, loading: ladderLoading } = useLadder(currentYear);
  const { data: allUsers, loading: usersLoading } = useUsers();
  
  const loading = ladderLoading || usersLoading;

  if (loading) {
    return <LoadingSpinner text="Loading ladder..." />;
  }

  // Create complete ladder with all users (including those with no scores)
  const createCompleteLadder = () => {
    if (!allUsers) return [];
    
    // Create a map of existing ladder entries
    const ladderMap = new Map();
    if (ladder?.ladder) {
      ladder.ladder.forEach(entry => {
        ladderMap.set(entry.user_id, entry);
      });
    }
    
    // Create entries for all users
    const completeLadder = allUsers.map(user => {
      const existingEntry = ladderMap.get(user.id);
      
      if (existingEntry) {
        return existingEntry;
      } else {
        // Create entry for user with no scores
        return {
          user_id: user.id,
          user_name: user.name,
          family_group_name: user.family_group_name || user.family_group?.name || 'Unknown',
          total_tips: 0,
          correct_tips: 0,
          percentage: 0,
          rank: ladder?.ladder?.length ? ladder.ladder.length + 1 : 1
        };
      }
    });
    
    // Sort by points (correct_tips) descending, then by percentage
    return completeLadder.sort((a, b) => {
      if (a.correct_tips !== b.correct_tips) {
        return b.correct_tips - a.correct_tips;
      }
      return b.percentage - a.percentage;
    }).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  };
  
  const completeLadder = createCompleteLadder();
  
  if (!allUsers || allUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p>No tipsters have been added to the competition yet.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {currentYear} Competition Ladder
        </h2>
        <p className="text-gray-600">
          Current standings for all {completeLadder.length} tipsters
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tips
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Correct
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {completeLadder.map((entry) => {
                const isCurrentUser = currentUser?.id === entry.user_id;
                
                return (
                  <tr 
                    key={entry.user_id}
                    className={`
                      ${isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                      hover:bg-gray-50 transition-colors
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          text-sm font-bold
                          ${entry.rank <= 3 ? 'text-yellow-600' : 'text-gray-900'}
                        `}>
                          {getRankDisplay(entry.rank)}
                        </span>
                        {entry.rank === 1 && <span className="ml-2 text-yellow-500">👑</span>}
                        {entry.rank === 2 && <span className="ml-2 text-gray-400">🥈</span>}
                        {entry.rank === 3 && <span className="ml-2 text-orange-600">🥉</span>}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          text-sm font-medium
                          ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}
                        `}>
                          {entry.user_name}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {entry.total_tips}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {entry.correct_tips}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`
                        text-sm font-medium
                        ${entry.percentage >= 60 ? 'text-green-600' : 
                          entry.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}
                      `}>
                        {formatPercentage(entry.percentage)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-gray-900">
                        {entry.correct_tips}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}