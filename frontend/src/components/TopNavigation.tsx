import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function TopNavigation() {
  const { currentUser, setCurrentUser, isAdmin } = useApp();
  const location = useLocation();

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/tipping', label: 'Tipping', icon: '📋' },
    { path: '/ladder', label: 'Ladder', icon: '🏆' },
    { path: '/history', label: 'All Tips', icon: '📅' },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-lovable-500 to-lovable-700 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cooksey Plate</h1>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      px-3 py-2 text-sm font-medium transition-colors duration-200
                      ${isActive
                        ? 'text-lovable-600'
                        : 'text-gray-600 hover:text-lovable-600'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {currentUser && (
              <>
                <Link
                  to="/ladder"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 hover:text-lovable-600 transition-colors"
                >
                  View Leaderboard
                </Link>
                <Link
                  to="/tipping"
                  className="inline-flex px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-lovable-500 to-lovable-600 hover:from-lovable-600 hover:to-lovable-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Start Tipping
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-lovable-600 transition-colors ml-2"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  block px-3 py-2 text-base font-medium transition-colors
                  ${isActive
                    ? 'text-lovable-600'
                    : 'text-gray-600 hover:text-lovable-600'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
          {currentUser && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                <div className="text-xs text-afl-600">{currentUser.family_group_name}</div>
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-primary-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}