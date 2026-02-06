
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { NAVIGATION_ITEMS, ADMIN_NAVIGATION_ITEMS } from '../utils/constants';

// Simple icons as text/symbols
const icons = {
  home: '🏠',
  clipboard: '📋',
  trophy: '🏆',
  calendar: '📅',
  settings: '⚙️',
};

export default function Navigation() {
  const location = useLocation();
  const { isAdmin } = useApp();

  const allNavItems = [
    ...NAVIGATION_ITEMS,
    ...(isAdmin ? ADMIN_NAVIGATION_ITEMS : []),
  ];

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 fixed inset-y-0 left-0 z-50 w-64 lg:static lg:inset-auto">
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 py-6">
          <div className="text-xl font-bold text-gray-900">
            Cooksey Plate
          </div>
        </div>
        
        <div className="flex-1 px-4 pb-4 space-y-1">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive 
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-3 text-lg">
                  {icons[item.icon as keyof typeof icons]}
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>
        
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            AFL Season 2026
          </div>
        </div>
      </div>
    </nav>
  );
}