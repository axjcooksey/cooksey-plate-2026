import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useUsers, useFamilyGroups } from '../hooks/useApi';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const { setCurrentUser } = useApp();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: familyGroups, loading: groupsLoading } = useFamilyGroups();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleLogin = () => {
    if (selectedUserId && users) {
      const user = users.find(u => u.id === parseInt(selectedUserId));
      if (user) {
        setCurrentUser(user);
      }
    }
  };

  if (usersLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading tipsters...</p>
        </div>
      </div>
    );
  }

  // Sort users alphabetically by name
  const sortedUsers = users?.sort((a, b) => a.name.localeCompare(b.name)) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Login */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title and Subtitle - Centered above everything */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Cooksey Plate
            </h1>
            <h2 className ="text-2  xl lg:text-2xl font-semibold text-red-600 mb-2">
              Footy Tipping
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Tip every round, track your form, and battle for everlasting family glory.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Hero Image */}
            <div>
              <div className="relative">
                <img
                  src="/hero-afl.jpg"
                  alt="AFL Football on stadium field"
                  className="w-full h-64 lg:h-80 object-cover rounded-2xl shadow-lg"
                />
              </div>
            </div>
            
            {/* Right Side - Login Card */}
            <div className="space-y-6">
              {/* Login Card */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-3">🏆</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Join the Competition
                  </h2>
                  <p className="text-gray-600">
                    Select your name to start tipping
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Select your name
                    </label>
                    <select
                      id="user-select"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    >
                      <option value="">Choose your name...</option>
                      {sortedUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={!selectedUserId}
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                      ${selectedUserId
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    Enter Competition
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USPs Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Join the Cooksey Plate?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for the ultimate family tipping experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Simple Weekly Tips</h3>
              <p className="text-gray-600">Submit your picks in minutes — friendly reminders keep everyone involved.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Live Ladder & Form</h3>
              <p className="text-gray-600">Track round-by-round scores and streaks all season long.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Annual Trophy Bragging Rights</h3>
              <p className="text-gray-600">Win the Cooksey Plate and cement your place in family folklore.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}