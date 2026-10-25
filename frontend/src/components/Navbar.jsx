import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Search, Plus, LogIn, LogOut, Package, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Shared styling for primary action buttons in the navbar (Report Lost, Report Found, Login)
const navPrimaryBtnClass = "flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary";

export default function Navbar({ onNavigate }) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarButtonRef = useRef(null);

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

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        avatarButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

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

        {/* Right: Action Buttons & Auth Avatar / Login */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* Report Lost Item button */}
          <button
            onClick={() => handleReportClick('lost')}
            className={navPrimaryBtnClass}
            title="Report Lost Item"
          >
            <Search size={15} strokeWidth={2.5} />
            <span>
              <span className="hidden sm:inline">Report </span>
              <span>Lost</span>
              <span className="hidden md:inline"> Item</span>
            </span>
          </button>

          {/* Report Found Item button */}
          <button
            onClick={() => handleReportClick('found')}
            className={navPrimaryBtnClass}
            title="Report Found Item"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>
              <span className="hidden sm:inline">Report </span>
              <span>Found</span>
              <span className="hidden md:inline"> Item</span>
            </span>
          </button>

          {/* Right end: Profile Avatar Dropdown (when logged in) or Login button (when logged out) */}
          {user ? (
            <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={dropdownRef}>
              <button
                ref={avatarButtonRef}
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
                aria-label="Account menu"
                title={user.email}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary select-none cursor-pointer"
              >
                <User size={19} className="text-white" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn"
                >
                  {/* User Email (shown as text, NOT a link) */}
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      User Account
                    </span>
                    <p className="text-xs font-semibold text-slate-800 truncate mt-0.5 select-text" title={user.email}>
                      {user.email}
                    </p>
                  </div>

                  {/* My Posts link */}
                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate('my-posts');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary-brand flex items-center gap-2 transition-colors focus:bg-slate-50 focus:outline-none cursor-pointer"
                    >
                      <Package size={15} className="text-primary-brand" />
                      <span>My posts</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors focus:bg-red-50 focus:outline-none cursor-pointer"
                    >
                      <LogOut size={15} className="text-slate-400" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-1 sm:pl-2 border-l border-slate-200">
              <button
                onClick={() => onNavigate('login')}
                className={navPrimaryBtnClass}
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
