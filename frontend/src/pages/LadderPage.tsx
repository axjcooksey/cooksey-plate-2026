
import { useApp } from '../contexts/AppContext';
import { useLadder } from '../hooks/useApi';
import { getRankDisplay, formatPercentage } from '../utils/helpers';
import { FAMILY_COLORS } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LadderPage() {
  const { currentYear, currentUser } = useApp();
  const { data: ladder, loading } = useLadder(currentYear);

  if (loading) {
    return <LoadingSpinner text="Loading ladder..." />;
  }

  if (!ladder?.ladder) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-medium mb-2">No ladder data available</h3>
          <p>The competition ladder will appear here once games have been played.</p>
        </div>
      </div>
    );
  }

  // Group ladder entries by family for color coding
  const familyGroups = ladder.ladder.reduce((acc, entry) => {
    const family = entry.family_group_name || 'Unknown';
    if (!acc[family]) acc[family] = [];
    acc[family].push(entry);
    return acc;
  }, {} as Record<string, typeof ladder.ladder>);

  const familyColorMap: Record<string, string> = {};
  Object.keys(familyGroups).forEach((family, index) => {
    familyColorMap[family] = FAMILY_COLORS[index % FAMILY_COLORS.length];
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {currentYear} Competition Ladder
        </h2>
        <p className="text-gray-600">
          Current standings for all {ladder.ladder.length} competitors
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Family
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
              {ladder.ladder.map((entry) => {
                const isCurrentUser = currentUser?.id === entry.user_id;
                const familyColor = familyColorMap[entry.family_group_name || 'Unknown'];
                
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
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${familyColor}`}>
                        {entry.family_group_name}
                      </span>
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

      {/* Family Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Family Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(familyGroups).map(([familyName, members]) => {
            const familyColor = familyColorMap[familyName];
            const avgAccuracy = members.reduce((sum, member) => sum + member.percentage, 0) / members.length;
            const totalPoints = members.reduce((sum, member) => sum + member.correct_tips, 0);
            const bestRank = Math.min(...members.map(member => member.rank));
            
            return (
              <div key={familyName} className={`rounded-lg p-4 ${familyColor}`}>
                <h4 className="font-medium text-gray-900 mb-2">{familyName}</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Members:</span>
                    <span className="font-medium">{members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best rank:</span>
                    <span className="font-medium">{getRankDisplay(bestRank)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg accuracy:</span>
                    <span className="font-medium">{formatPercentage(avgAccuracy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total points:</span>
                    <span className="font-medium">{totalPoints}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}