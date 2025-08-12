import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useUsers } from '../hooks/useApi';

export default function UserSelector() {
  const { currentUser, setCurrentUser } = useApp();
  const { data: users, loading } = useUsers();
  const [isOpen, setIsOpen] = useState(false);

  const handleUserChange = (user: any) => {
    setCurrentUser(user);
    setIsOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsOpen(false);
  };

  if (loading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {currentUser?.name.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Switch User</p>
                <p className="text-xs text-gray-600">Currently: {currentUser?.name}</p>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {users?.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserChange(user)}
                    className={`
                      w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors
                      ${currentUser?.id === user.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.family_group_name}</p>
                      </div>
                      {user.role === 'admin' && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}