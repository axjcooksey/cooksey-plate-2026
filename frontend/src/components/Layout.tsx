import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import TopNavigation from './TopNavigation';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { currentUser, loading, currentRound } = useApp();
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavigation />
      
      {/* Welcome Section - Only on Home Page */}
      {isHomePage && currentRound && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Welcome back, {currentUser.name}!
            </h2>
            <p className="text-lg text-gray-600">
              {currentRound.status === 'upcoming' && 'Ready to make your tips for'}{' '}
              {currentRound.status === 'active' && 'Currently playing'}{' '}
              {currentRound.status === 'completed' && 'Results for'}{' '}
              <span className="font-semibold text-lovable-600">Round {currentRound.round_number}</span>
            </p>
          </div>
        </div>
      )}
      
      
      <main className="flex-1 bg-white">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isHomePage ? 'py-8' : 'py-8 pt-12'}`}>
          {loading && (
            <div className="mb-6">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-lg bg-slate-200 h-4 w-1/4"></div>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}