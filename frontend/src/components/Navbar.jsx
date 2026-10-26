import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, Home, FilePlus, ChevronDown, 
  Info, Search, Bell, LogOut, User, Menu, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ onNavigate, currentView = 'feed' }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const reportDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const avatarButtonRef = useRef(null);

  const handleReportClick = (type = 'lost') => {
    setIsReportOpen(false);
    setIsMobileMenuOpen(false);
    if (!user) {
      // Preserve intended reporting destination for post-login return
      onNavigate('login', { redirect: `#/report?type=${type}` });
    } else {
      onNavigate('report', { type });
    }
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    onNavigate('feed');
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim()) {
        onNavigate('feed', { search: searchQuery.trim() });
      }
    }
  };

  // Close report dropdown on click outside or Escape
  useEffect(() => {
    if (!isReportOpen) return;

    const handleClickOutside = (e) => {
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(e.target)) {
        setIsReportOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsReportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReportOpen]);

  // Close profile dropdown on click outside or Escape
  useEffect(() => {
    if (!isProfileOpen) return;

    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        avatarButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ================= LEFT SIDE: BRAND ================= */}
        <div 
          onClick={() => {
            setIsMobileMenuOpen(false);
            onNavigate('feed');
          }}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-brand/10 text-primary-brand flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs flex-shrink-0">
            <GraduationCap size={24} className="text-primary-brand" />
          </div>
          <div className="flex items-baseline gap-1.5 text-lg sm:text-xl font-black tracking-tight">
            <span className="text-slate-900">Campus</span>
            <span className="text-primary-brand">Lost &amp; Found</span>
          </div>
        </div>

        {/* ================= CENTER NAVIGATION (DESKTOP) ================= */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          
          {/* Home */}
          <button
            onClick={() => onNavigate('feed')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              currentView === 'feed'
                ? 'text-primary-brand bg-primary-light/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home size={16} />
            <span>Home</span>
          </button>

          {/* Report Dropdown */}
          <div className="relative" ref={reportDropdownRef}>
            <button
              onClick={() => setIsReportOpen(!isReportOpen)}
              aria-haspopup="true"
              aria-expanded={isReportOpen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                isReportOpen || currentView === 'report'
                  ? 'text-primary-brand bg-primary-light/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FilePlus size={16} />
              <span>Report</span>
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-200 ${isReportOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isReportOpen && (
              <div 
                role="menu"
                className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn"
              >
                <button
                  type="button"
                  onClick={() => handleReportClick('lost')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black">!</span>
                  <span>Report Lost Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportClick('found')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black">✓</span>
                  <span>Report Found Item</span>
                </button>
              </div>
            )}
          </div>

          {/* About */}
          <button
            onClick={() => onNavigate('about')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              currentView === 'about'
                ? 'text-primary-brand bg-primary-light/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Info size={16} />
            <span>About</span>
          </button>

        </nav>

        {/* ================= RIGHT SIDE: SEARCH, LOGIN, NOTIFICATIONS, PROFILE ================= */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* 1. Search Bar */}
          <div className="hidden xl:flex items-center relative">
            <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-44 lg:w-48 pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50/60"
            />
          </div>

          {/* 2. Notifications with real-time unread badge and dropdown */}
          <div className="relative" ref={notificationButtonRef}>
            <button
              type="button"
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer relative"
              title="Notifications"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              aria-haspopup="dialog"
              aria-expanded={isNotificationOpen}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-2xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              onNavigate={onNavigate}
              anchorRef={notificationButtonRef}
            />
          </div>

          {/* 3. When Logged Out: Login button */}
          {!user && (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-1.5 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span>Login</span>
            </button>
          )}

          {/* 4. When Logged In: Profile Avatar and Dropdown */}
          {user && (
            <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={profileDropdownRef}>
              <button
                ref={avatarButtonRef}
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-label="Account menu"
                title={user.email}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary select-none cursor-pointer"
              >
                <User size={19} className="text-white" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div 
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn"
                >
                  {/* Header Section: Signed in as user@example.com */}
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Signed in as
                    </span>
                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5 select-text" title={user.email}>
                      {user.email}
                    </p>
                  </div>

                  {/* My Profile Action */}
                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary-brand flex items-center gap-2.5 transition-colors focus:bg-slate-50 focus:outline-none cursor-pointer"
                    >
                      <User size={15} className="text-primary-brand" />
                      <span>My Profile</span>
                    </button>
                  </div>

                  {/* Logout Action (Only inside dropdown) */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2.5 transition-colors focus:bg-red-50 focus:outline-none cursor-pointer"
                    >
                      <LogOut size={15} className="text-slate-400 hover:text-red-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

        </div>

      </div>

      {/* ================= MOBILE EXPANDED MENU ================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2.5 shadow-lg animate-fadeIn">
          
          {/* Mobile Search */}
          <div className="relative mb-2">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsMobileMenuOpen(false);
                  handleSearchSubmit(e);
                }
              }}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50"
            />
          </div>

          {/* Navigation Links */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('feed');
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              currentView === 'feed' ? 'bg-primary-light text-primary-brand' : 'bg-slate-50 text-slate-700'
            }`}
          >
            <Home size={15} />
            <span>Home</span>
          </button>

          <div className="py-2 border-y border-slate-100 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Reporting
            </div>
            <button
              onClick={() => handleReportClick('lost')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-orange-50/60 text-orange-700 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">!</span>
                <span>Report Lost Item</span>
              </span>
              <ChevronDown size={14} className="-rotate-90 text-orange-400" />
            </button>

            <button
              onClick={() => handleReportClick('found')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-50/60 text-emerald-700 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">✓</span>
                <span>Report Found Item</span>
              </span>
              <ChevronDown size={14} className="-rotate-90 text-emerald-400" />
            </button>
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('about');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              currentView === 'about' ? 'bg-primary-light text-primary-brand' : 'bg-slate-50 text-slate-700'
            }`}
          >
            <Info size={15} />
            <span>About Campus Lost &amp; Found</span>
          </button>

          {/* Auth Section in Mobile Menu */}
          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-500 font-medium">
                  <span className="truncate mr-2">Signed in as <strong className="text-slate-800">{user.email}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsNotificationOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 relative flex-shrink-0"
                    title="Notifications"
                  >
                    <Bell size={15} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('profile');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer relative"
                  title="Notifications"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsNotificationOpen(true);
                  }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
