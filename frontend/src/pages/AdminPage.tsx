import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useUsers, useFamilyGroups, useRounds } from '../hooks/useApi';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminPage() {
  const { currentUser, currentYear } = useApp();
  const { data: users } = useUsers();
  const { data: familyGroups } = useFamilyGroups();
  const { data: rounds } = useRounds(currentYear);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rounds' | 'data'>('overview');
  const [syncingData, setSyncingData] = useState(false);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-red-500">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const handleSyncSquiggleData = async () => {
    setSyncingData(true);
    try {
      // API call would go here
      console.log('Syncing Squiggle data...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    } catch (error) {
      console.error('Failed to sync data:', error);
    } finally {
      setSyncingData(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'rounds', name: 'Rounds', icon: '🏈' },
    { id: 'data', name: 'Data Sync', icon: '🔄' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Administration Panel
        </h2>
        <p className="text-gray-600">
          Manage the competition, users, and data synchronization
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">👥</div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {users?.length || 0}
                      </div>
                      <div className="text-sm text-blue-700">Total Users</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">👨‍👩‍👧‍👦</div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {familyGroups?.length || 0}
                      </div>
                      <div className="text-sm text-green-700">Family Groups</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">🏈</div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {rounds?.length || 0}
                      </div>
                      <div className="text-sm text-purple-700">Rounds</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">👑</div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {users?.filter(u => u.role === 'admin').length || 0}
                      </div>
                      <div className="text-sm text-yellow-700">Administrators</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>• Competition initialized for {currentYear} season</div>
                  <div>• {users?.length || 0} users imported from family groups</div>
                  <div>• Squiggle API integration active</div>
                  <div>• Database schema up to date</div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Family Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.family_group_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`
                            inline-flex px-2 py-1 text-xs font-medium rounded-full
                            ${user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                            }
                          `}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rounds Tab */}
          {activeTab === 'rounds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Round Management</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['upcoming', 'active', 'completed'].map(status => {
                  const statusRounds = rounds?.filter(r => r.status === status) || [];
                  const statusColors = {
                    upcoming: 'bg-gray-50 border-gray-200',
                    active: 'bg-green-50 border-green-200',
                    completed: 'bg-blue-50 border-blue-200'
                  };

                  return (
                    <div key={status} className={`rounded-lg border p-4 ${statusColors[status as keyof typeof statusColors]}`}>
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">
                        {status} Rounds ({statusRounds.length})
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {statusRounds.map(round => (
                          <div key={round.id} className="bg-white rounded p-3 text-sm">
                            <div className="font-medium">Round {round.round_number}</div>
                            {round.lockout_time && (
                              <div className="text-gray-600 text-xs mt-1">
                                {formatDate(round.lockout_time, 'dd/MM/yyyy HH:mm')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Sync Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Data Synchronization</h3>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="text-yellow-400 mr-3">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Data Sync Operations
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      These operations will update the database with the latest information from external sources.
                      Use with caution as this may affect ongoing competitions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        Sync Squiggle Data
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Updates games, scores, and team information from the Squiggle API
                      </p>
                    </div>
                    <button
                      onClick={handleSyncSquiggleData}
                      disabled={syncingData}
                      className={`
                        px-4 py-2 rounded-md font-medium transition-colors
                        ${syncingData
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
                      `}
                    >
                      {syncingData ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Syncing...
                        </div>
                      ) : (
                        'Sync Now'
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        Calculate Ladder
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Recalculates the competition ladder based on current tips and results
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors">
                      Calculate
                    </button>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        Export Data
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Download competition data as CSV for backup or analysis
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}