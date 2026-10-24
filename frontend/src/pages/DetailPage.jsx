import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, MapPin, Calendar, Check, Phone, Copy, 
  Sparkles, AlertCircle, Loader2, ShieldCheck, ArrowRight, Package
} from 'lucide-react';
import { api } from '../services/api';
import MatchCard from '../components/MatchCard';
import Modal from '../components/Modal';

export default function DetailPage({ itemId, onBack, onSelectMatch }) {
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contact reveal state
  const [revealedContact, setRevealedContact] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [markingReturned, setMarkingReturned] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setRevealedContact(null);
    try {
      const [itemData, matchesData] = await Promise.all([
        api.getItemById(itemId),
        api.getMatches(itemId)
      ]);
      setItem(itemData);
      setMatches(matchesData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      loadData();
    }
  }, [itemId]);

  const handleRevealContact = async () => {
    setRevealing(true);
    try {
      const data = await api.revealContact(itemId);
      setRevealedContact(data.contact);
    } catch (err) {
      alert('Unable to retrieve contact details: ' + (err.response?.data?.message || err.message));
    } finally {
      setRevealing(false);
    }
  };

  const handleCopyContact = () => {
    if (!revealedContact) return;
    navigator.clipboard.writeText(revealedContact);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmReturn = async () => {
    setMarkingReturned(true);
    try {
      const res = await api.markReturned(itemId);
      setItem(res.item);
      setShowReturnModal(false);
    } catch (err) {
      alert('Failed to mark item as returned: ' + (err.response?.data?.message || err.message));
    } finally {
      setMarkingReturned(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 size={36} className="animate-spin text-primary-brand mb-3" />
        <p className="text-sm font-semibold">Loading item details and scanning for matches...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs text-slate-800">
          <AlertCircle size={36} className="mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-bold">Item Not Found</h3>
          <p className="text-sm mt-1 text-slate-500">{error || 'This post may have been removed or does not exist.'}</p>
          <button
            onClick={onBack}
            className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-xs hover:bg-primary-hover"
          >
            Back to feed
          </button>
        </div>
      </main>
    );
  }

  const isLost = item.type === 'lost';
  const isReturned = item.status === 'returned';
  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to feed</span>
      </button>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Item Details (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          
          {/* Main Photo */}
          <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
            <img 
              src={item.imageUrl} 
              alt={item.description || `${item.color} ${item.category}`}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {isLost ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ffedd5] text-[#ea580c] border border-orange-200 shadow-xs">
                  <span className="w-4 h-4 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[10px] font-black">!</span>
                  <span>Lost Item</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d1fae5] text-[#059669] border border-emerald-200 shadow-xs">
                  <span className="w-4 h-4 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-black">✓</span>
                  <span>Found Item</span>
                </span>
              )}

              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs ${
                isReturned 
                  ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}>
                {isReturned ? 'Returned / Resolved' : 'Active'}
              </span>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8">
            
            {/* Tag Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ede9fe] text-[#4f46e5] capitalize">
                Category: {item.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0284c7] capitalize">
                Color: {item.color}
              </span>
            </div>

            {/* Title / Description */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3">
              {item.description || `Unspecified ${item.color} ${item.category}`}
            </h1>

            {/* Custody Information (Found Items Only) */}
            {item.currentLocation && (
              <div className="mb-5 p-4 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package size={18} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-teal-900 uppercase tracking-wider">Item Custody</span>
                  <p className="text-sm font-semibold text-teal-800 mt-0.5">{item.currentLocation}</p>
                </div>
              </div>
            )}

            {/* Metadata (Location & Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-100 my-5 text-sm">
              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reported Location</span>
                  <span className="font-semibold text-slate-800">{item.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reported Date</span>
                  <span className="font-semibold text-slate-800">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Action Bar: Privacy-Preserving Contact & Resolution */}
            {isReturned ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-600 font-semibold text-sm flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
                <span>This item has been marked as returned to its owner.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                
                {/* Contact Reveal Box */}
                {revealedContact ? (
                  <div className="p-4.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <Phone size={16} className="text-primary-brand" />
                        <span className="text-slate-700">Poster Contact:</span>
                        <span className="text-slate-900 font-extrabold select-all">{revealedContact}</span>
                      </div>
                      <button
                        onClick={handleCopyContact}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-primary-brand text-xs font-bold hover:bg-indigo-50 transition-colors shadow-2xs"
                      >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied!' : 'Copy Contact'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                      💡 <strong>Verification Tip:</strong> Ask them to describe one detail that isn’t obvious in the photo (like internal contents or a scratch) before handing over the item.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleRevealContact}
                    disabled={revealing}
                    className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  >
                    {revealing ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                    <span>Contact the poster</span>
                  </button>
                )}

                {/* Mark as Returned Button */}
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ShieldCheck size={15} className="text-slate-500" />
                  <span>Mark as returned</span>
                </button>

              </div>
            )}

          </div>

        </div>

        {/* Right Column: Top Matches (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-light text-primary-brand flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-base font-black text-slate-900">Top Likely Matches</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {matches.length} {matches.length === 1 ? 'Candidate' : 'Candidates'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-2.5 mb-4">
              Our explainable matching engine evaluates opposite-side active items across category, color, keywords, campus area, and report date.
            </p>

            {matches.length === 0 ? (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 text-center">
                <p className="text-sm font-bold text-slate-800 mb-1">
                  No matches detected yet
                </p>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  We'll automatically highlight candidate items as new reports are published on campus.
                </p>
                <div className="p-3 bg-white rounded-xl text-[11px] text-slate-600 border border-slate-200 text-left">
                  💡 <strong>Tip:</strong> Adding specific description keywords (brand, stickers, marks) increases candidate match accuracy.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {matches.map((m) => (
                  <MatchCard key={m.item._id} match={m} onSelect={onSelectMatch} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showReturnModal}
        title="Mark item as returned?"
        message="This item will be marked as resolved, removed from active candidate matching, and safely archived."
        confirmText={markingReturned ? 'Updating...' : 'Yes, mark returned'}
        onConfirm={handleConfirmReturn}
        onCancel={() => setShowReturnModal(false)}
      />

    </main>
  );
}
