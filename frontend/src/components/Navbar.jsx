import React from 'react';
import { GraduationCap, Search, Plus, LogIn, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onNavigate }) {
  const { user, logout } = useAuth();

  const handleReportClick = (type) => {
    if (!user) {
      // Redirect to login when logged out, then back to the form
      onNavigate('login', { redirect: `#/report?type=${type}` });
    } else {
      onNavigate('report', { type });
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('feed');
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: App Name (Clicking goes to feed) */}
        <div 
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-brand/10 text-primary-brand flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs flex-shrink-0">
            <GraduationCap size={24} className="text-primary-brand sm:w-6 sm:h-6" />
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5 text-lg sm:text-2xl font-black tracking-tight">
            <span className="text-slate-900">Campus</span>
            <span className="text-primary-brand hidden min-[440px]:inline">Lost &amp; Found</span>
          </div>
        </div>

        {/* Right: Action Buttons & Auth */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* I Lost Something button */}
          <button
            onClick={() => handleReportClick('lost')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex-shrink-0"
            title="I lost something"
          >
            <Search size={15} strokeWidth={2.5} />
            <span>
              <span className="hidden sm:inline">I lost </span>
              <span className="sm:hidden">Lost</span>
              <span className="hidden md:inline">something</span>
            </span>
          </button>

          {/* I Found Something button */}
          <button
            onClick={() => handleReportClick('found')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex-shrink-0"
            title="I found something"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>
              <span className="hidden sm:inline">I found </span>
              <span className="sm:hidden">Found</span>
              <span className="hidden md:inline">something</span>
            </span>
          </button>

          {/* Auth Controls */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
              <button
                onClick={() => onNavigate('my-posts')}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-2 rounded-xl text-slate-700 hover:text-primary-brand hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors"
                title="My Reported Items"
              >
                <Package size={16} className="text-primary-brand" />
                <span className="hidden md:inline">My posts</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs sm:text-sm transition-colors"
                title="Log out"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="pl-1 sm:pl-2 border-l border-slate-200">
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors shadow-2xs"
              >
                <LogIn size={15} />
                <span>Login</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
