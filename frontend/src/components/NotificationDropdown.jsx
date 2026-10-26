import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown({ isOpen, onClose, onNavigate, anchorRef }) {
  const dropdownRef = useRef(null);
  const { notifications, unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'matches'

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const matchNotifications = notifications.filter((n) => n.type === 'match');
  const displayedNotifications =
    activeTab === 'matches' ? matchNotifications : notifications;

  const handleItemClick = (notif) => {
    onClose();
    const itemId = notif.item?._id || notif.item;
    if (itemId) {
      onNavigate('detail', { id: itemId });
    }
  };

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-fadeIn select-none font-sans"
    >
      {/* Dropdown Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-primary-brand" />
          <h3 className="text-sm font-black text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-brand text-white">
              {unreadCount} active
            </span>
          )}
        </div>
      </div>

      {/* Tabs (if matches exist) */}
      {matchNotifications.length > 0 && (
        <div className="flex items-center px-3 pt-2 gap-1 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-indigo-700'
            }`}
          >
            <Sparkles size={12} className="text-primary-brand" />
            <span>Matches ({matchNotifications.length})</span>
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-100">
        {displayedNotifications.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-400">
            <Bell size={28} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-600">No notifications yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When new items are reported or matches are found, they will appear here.
            </p>
          </div>
        ) : (
          displayedNotifications.map((notif) => {
            const isMatch = notif.type === 'match';
            const item = notif.item;
            const isReturned = Boolean(
              notif.isResolved ||
              notif.isReturned ||
              item?.status === 'returned' ||
              notif.matchedItem?.status === 'returned'
            );

            return (
              <div
                key={notif._id}
                onClick={() => handleItemClick(notif)}
                className={`p-3.5 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start relative group ${
                  !isReturned ? 'bg-indigo-50/20' : 'opacity-75'
                }`}
              >
                {/* Left Icon / Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isMatch
                      ? 'bg-indigo-100 text-primary-brand'
                      : item?.type === 'lost'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {isMatch ? (
                    <Sparkles size={15} />
                  ) : (
                    <Bell size={14} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isMatch
                          ? 'bg-indigo-100 text-primary-brand'
                          : item?.type === 'lost'
                          ? 'bg-orange-50 text-orange-600 border border-orange-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      {isMatch ? 'Match Alert' : item?.type === 'lost' ? 'Lost Item' : 'Found Item'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-brand transition-colors line-clamp-1">
                    {notif.title}
                  </h4>

                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Footer actions: View details and Returned status */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-brand group-hover:translate-x-0.5 transition-transform">
                      <span>View details</span>
                      <ArrowRight size={11} />
                    </span>

                    {isReturned ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Check size={10} className="text-emerald-600" />
                        <span>Returned</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Active unreturned indicator dot */}
                {!isReturned && (
                  <span className="w-2 h-2 rounded-full bg-primary-brand flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
