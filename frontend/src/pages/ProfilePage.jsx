import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Calendar, Package, CheckCircle2, Clock, 
  AlertCircle, Loader2, ChevronRight, MapPin, 
  ShieldCheck, ArrowRight, Sparkles, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage({ onSelectItem, onNavigate }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'returned'
  const [returningId, setReturningId] = useState(null);

  const fetchMyItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyItems();
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load your account activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
  }, []);

  const handleMarkReturned = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to mark this item as returned? This will archive it from active matching.')) {
      return;
    }

    setReturningId(id);
    try {
      const res = await api.markReturned(id);
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: 'returned' } : item))
      );
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to mark item returned.');
    } finally {
      setReturningId(null);
    }
  };

  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recent Member';

  const totalItems = items.length;
  const activeItems = items.filter((i) => i.status !== 'returned').length;
  const returnedItems = items.filter((i) => i.status === 'returned').length;

  const filteredItems = items.filter((item) => {
    if (filterTab === 'active') return item.status !== 'returned';
    if (filterTab === 'returned') return item.status === 'returned';
    return true;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* 1. Profile Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-sm flex-shrink-0">
              <User size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  User Profile
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Member
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 mt-1">
                <Mail size={14} className="text-slate-400" />
                <span>{user?.email}</span>
              </p>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <Calendar size={13} />
                <span>Member since {memberSince}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-light text-primary-brand flex items-center justify-center flex-shrink-0">
              <Package size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalItems}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-amber-700/80 uppercase tracking-wider">Active Listings</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{activeItems}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider">Returned / Resolved</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{returnedItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. My Reported Items Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              My Reported Items
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review candidate matches or mark resolved items as returned
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalItems})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'active' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeItems})
            </button>
            <button
              onClick={() => setFilterTab('returned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'returned' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Returned ({returnedItems})
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500">
            <Loader2 size={32} className="animate-spin text-primary-brand mb-3" />
            <p className="text-xs font-semibold">Loading your posts...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-700 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchMyItems}
              className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="py-12 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No items found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              {filterTab === 'all' 
                ? "You haven't posted any lost or found items yet."
                : `You don't have any ${filterTab} items.`}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => onNavigate('report', { type: 'lost' })}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Report Lost Item
              </button>
              <button
                onClick={() => onNavigate('report', { type: 'found' })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Report Found Item
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isLost = item.type === 'lost';
              const isReturned = item.status === 'returned';
              const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
              });

              return (
                <div
                  key={item._id}
                  onClick={() => onSelectItem(item._id)}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex gap-4 items-start group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative border border-slate-100">
                    <img 
                      src={item.imageUrl} 
                      alt={item.description || item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      {isLost ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffedd5] text-[#ea580c] border border-orange-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                          <span>Lost Item</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d1fae5] text-[#059669] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
                          <span>Found Item</span>
                        </span>
                      )}

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isReturned 
                          ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isReturned ? 'Returned' : 'Active'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-primary-brand transition-colors">
                      {item.description || `${item.color} ${item.category}`}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="truncate flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        {item.location}
                      </span>
                      <span>&bull;</span>
                      <span className="flex-shrink-0 flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-primary-brand group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Details &amp; Matches</span>
                        <ChevronRight size={13} />
                      </span>

                      {!isReturned && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkReturned(e, item._id)}
                          disabled={returningId === item._id}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          {returningId === item._id ? 'Saving...' : 'Mark returned'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </main>
  );
}
