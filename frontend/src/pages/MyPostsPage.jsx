import React, { useState, useEffect } from 'react';
import { 
  Package, Loader2, AlertCircle, Plus, Search, 
  MapPin, Calendar, CheckCircle2, ChevronRight, ArrowLeft 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyPostsPage({ onSelectItem, onNavigate }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returningId, setReturningId] = useState(null);

  const fetchMyItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyItems();
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load your posts');
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
      alert(err.response?.data?.error || err.message || 'Failed to mark item returned');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200/80">
        <div>
          <button
            onClick={() => onNavigate('feed')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to feed</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Reported Items
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Logged in as <span className="font-bold text-slate-800">{user?.email}</span> — manage and resolve your posts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('report', { type: 'lost' })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Search size={14} strokeWidth={2.5} />
            <span>Report Lost</span>
          </button>
          <button
            onClick={() => onNavigate('report', { type: 'found' })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Report Found</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <Loader2 size={36} className="animate-spin text-primary-brand mb-3" />
          <p className="text-sm font-semibold">Loading your posts...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
          <button
            onClick={fetchMyItems}
            className="ml-auto px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">You haven't reported any items yet</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Report a lost possession or a found object to activate our AI auto-tagger and matching engine.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('report', { type: 'lost' })}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover"
            >
              Report Lost Item
            </button>
            <button
              onClick={() => onNavigate('report', { type: 'found' })}
              className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-700"
            >
              Report Found Item
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const isLost = item.type === 'lost';
            const isReturned = item.status === 'returned';
            const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={item._id}
                onClick={() => onSelectItem(item._id)}
                className={`bg-white border rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                  isReturned ? 'border-slate-200 bg-slate-50/50 opacity-80' : 'border-slate-200/90'
                }`}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60">
                    <img
                      src={item.imageUrl}
                      alt={item.description || item.category}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isLost ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isReturned ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isReturned ? 'Returned' : 'Active'}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold capitalize ml-auto">
                        {item.category} • {item.color}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed mb-2">
                      {item.description || `Reported ${item.category} near ${item.location}`}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Calendar size={12} />
                        <span>{formattedDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-primary-brand flex items-center gap-1">
                    View matches <ChevronRight size={12} />
                  </span>

                  {!isReturned && (
                    <button
                      onClick={(e) => handleMarkReturned(e, item._id)}
                      disabled={returningId === item._id}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {returningId === item._id ? (
                        <Loader2 size={13} className="animate-spin text-slate-500" />
                      ) : (
                        <CheckCircle2 size={13} className="text-emerald-600" />
                      )}
                      <span>Mark returned</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}
