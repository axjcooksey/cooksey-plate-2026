
import { useApp } from '../contexts/AppContext';
import UserSelector from './UserSelector';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { currentUser, currentRound, currentYear } = useApp();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {title || 'Cooksey Plate 2025'}
              </h1>
              {currentRound && (
                <p className="text-sm text-gray-600">
                  Round {currentRound.round_number} • {currentYear} • {currentRound.status}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser && (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentUser.family_group_name}
                  </p>
                </div>
                <UserSelector />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}