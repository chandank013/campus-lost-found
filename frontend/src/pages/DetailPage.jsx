import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Phone, Copy, Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
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
      <main className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-text-muted">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Loading item and finding matches...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-red-700">
          <AlertCircle size={36} className="mx-auto mb-3" />
          <h3 className="text-lg font-bold">Item Not Found</h3>
          <p className="text-sm mt-1">{error || 'This post may have been removed or does not exist.'}</p>
          <button
            onClick={onBack}
            className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
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
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-main mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to feed</span>
      </button>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Item Details (7 cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Photo */}
          <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
            <img 
              src={item.imageUrl} 
              alt={item.description || `${item.color} ${item.category}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span 
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                  isLost 
                    ? 'bg-lost-bg text-lost-text border border-amber-300' 
                    : 'bg-found-bg text-found-text border border-teal-300'
                }`}
              >
                {isLost ? 'Lost Item' : 'Found Item'}
              </span>

              {isReturned && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-returned-bg text-returned-text border border-slate-300 flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={14} />
                  <span>Returned</span>
                </span>
              )}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-chip-bg text-chip-text capitalize">
                Category: {item.category}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                Color: {item.color}
              </span>
            </div>

            {/* Description */}
            <h2 className="text-xl sm:text-2xl font-bold text-text-main mb-3">
              {item.description || `Unspecified ${item.color} ${item.category}`}
            </h2>

            {/* Where is it now? (Found items only) */}
            {item.currentLocation && (
              <div className="mb-4 p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-start gap-2">
                <MapPin size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Current Location / Custody: </span>
                  <span>{item.currentLocation}</span>
                </div>
              </div>
            )}

            {/* Metadata info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-y border-border text-sm text-text-muted my-5">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                <span><strong>Reported Location:</strong> {item.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span><strong>Date:</strong> {formattedDate}</span>
              </div>
            </div>

            {/* Actions Area */}
            {isReturned ? (
              <div className="p-4 bg-slate-100 border border-border rounded-xl text-center text-text-muted font-medium text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>This item has been marked as returned and resolved.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Contact Reveal */}
                {revealedContact ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <Phone size={16} />
                        <span>Poster Contact:</span>
                        <span className="text-text-main font-semibold select-all">{revealedContact}</span>
                      </div>
                      <button
                        onClick={handleCopyContact}
                        className="flex items-center gap-1 px-3 py-1 rounded-md bg-white border border-indigo-200 text-primary text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-indigo-900 mt-1">
                      💡 <strong>Verification Tip:</strong> Ask them to describe one detail that isn’t in the photo before handing over an item.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleRevealContact}
                    disabled={revealing}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {revealing ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                    <span>Contact the poster</span>
                  </button>
                )}

                {/* Mark as Returned Button */}
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full py-2.5 rounded-xl border border-border bg-white text-text-muted hover:text-text-main hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Mark as returned</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Top Matches (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="text-lg font-bold text-text-main">Top Likely Matches</h3>
            </div>
            <span className="text-xs font-semibold text-text-muted">
              Opposite side active items
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-xs">
              <p className="text-sm font-semibold text-text-main mb-1">
                No matches yet
              </p>
              <p className="text-xs text-text-muted leading-relaxed mb-3">
                We’ll show likely matches here when someone posts a matching item. Check back later.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-text-muted border border-border text-left">
                💡 <strong>Tip:</strong> Adding more specific keywords (like brand, stickers, or scratches) improves match accuracy.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {matches.map((m) => (
                <MatchCard key={m.item._id} match={m} onSelect={onSelectMatch} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showReturnModal}
        title="Mark item as returned?"
        message="This item will be marked as resolved, removed from active matching feeds, and no longer suggested to other posters."
        confirmText={markingReturned ? 'Updating...' : 'Yes, mark returned'}
        onConfirm={handleConfirmReturn}
        onCancel={() => setShowReturnModal(false)}
      />
    </main>
  );
}
