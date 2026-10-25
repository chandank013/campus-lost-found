import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, Check, Phone, Copy, 
  Sparkles, AlertCircle, Loader2, ShieldCheck, ArrowRight, Package,
  Lock, CheckCircle2, X, Maximize2, Lightbulb, Search,
  ShoppingBag, Laptop, BookOpen, Umbrella, Droplet, Palette
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';

const formatCategory = (cat) => {
  if (!cat) return '';
  if (cat.toLowerCase() === 'bag') return 'Backpack';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

const formatColor = (col) => {
  if (!col) return '';
  return col.charAt(0).toUpperCase() + col.slice(1);
};

const getCategoryIcon = (cat, size = 14) => {
  const c = (cat || '').toLowerCase();
  switch (c) {
    case 'bag':
      return <ShoppingBag size={size} />;
    case 'phone':
      return <Phone size={size} />;
    case 'bottle':
      return <Droplet size={size} />;
    case 'umbrella':
      return <Umbrella size={size} />;
    case 'laptop':
      return <Laptop size={size} />;
    case 'book':
      return <BookOpen size={size} />;
    default:
      return <Package size={size} />;
  }
};

export default function DetailPage({ itemId, onBack, onSelectMatch, onNavigate }) {
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Photo lightbox state
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  // Contact reveal state
  const [revealedContact, setRevealedContact] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Challenge modal state (for found items with private questions)
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [challengeError, setChallengeError] = useState(null);
  const [submittingChallenge, setSubmittingChallenge] = useState(false);

  // Return modal state (for item owner)
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnError, setReturnError] = useState(null);
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
      setMatches(matchesData || []);
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

  const handleContactClick = () => {
    if (!user) {
      if (onNavigate) {
        onNavigate('login', { redirect: `#/items/${itemId}` });
      } else {
        window.location.hash = `#/login?redirect=%23%2Fitems%2F${itemId}`;
      }
      return;
    }
    if (item?.privateQuestion) {
      setChallengeAnswer('');
      setChallengeError(null);
      setShowChallengeModal(true);
    } else {
      handleDirectReveal();
    }
  };

  const handleDirectReveal = async () => {
    setRevealing(true);
    try {
      const data = await api.revealContact(itemId);
      setRevealedContact(data.contact);
    } catch (err) {
      alert('Unable to retrieve contact details: ' + (err.response?.data?.message || err.response?.data?.error || err.message));
    } finally {
      setRevealing(false);
    }
  };

  const handleChallengeSubmit = async (e) => {
    e.preventDefault();
    if (!challengeAnswer.trim()) {
      setChallengeError('Please enter an answer to the verification question.');
      return;
    }

    setSubmittingChallenge(true);
    setChallengeError(null);
    try {
      const data = await api.revealContact(itemId, challengeAnswer.trim());
      setRevealedContact(data.contact);
      setShowChallengeModal(false);
      setChallengeAnswer('');
    } catch (err) {
      setChallengeError(err.response?.data?.message || err.response?.data?.error || 'Incorrect answer. Please try again.');
    } finally {
      setSubmittingChallenge(false);
    }
  };

  const handleCopyContact = () => {
    if (!revealedContact) return;
    navigator.clipboard.writeText(revealedContact);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    setMarkingReturned(true);
    setReturnError(null);
    try {
      const res = await api.markReturned(itemId);
      setItem(res.item);
      setShowReturnModal(false);
    } catch (err) {
      setReturnError(err.response?.data?.error || err.response?.data?.message || 'Failed to mark item returned.');
    } finally {
      setMarkingReturned(false);
    }
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowImageLightbox(false);
      }
    };
    if (showImageLightbox) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showImageLightbox]);

  // Loading State
  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-6">
          <ArrowLeft size={16} />
          <span>Back to feed</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-20 gap-6 lg:gap-7 items-start">
          {/* Left Skeleton */}
          <div className="lg:col-span-11 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs animate-pulse">
            <div className="w-full aspect-[16/10] bg-slate-200 rounded-xl mb-6"></div>
            <div className="h-7 w-2/3 bg-slate-200 rounded-lg mb-3"></div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-20 bg-slate-200 rounded-xl"></div>
              <div className="h-6 w-16 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
            <div className="h-4 w-4/5 bg-slate-100 rounded mb-6"></div>
            <div className="h-16 bg-slate-50 border border-slate-100 rounded-xl mb-6"></div>
            <div className="h-12 bg-slate-200 rounded-xl"></div>
          </div>

          {/* Right Skeleton */}
          <div className="lg:col-span-9 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs animate-pulse">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="h-6 w-44 bg-slate-200 rounded-lg"></div>
              <div className="h-6 w-24 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-28 bg-slate-50 border border-slate-100 rounded-2xl"></div>
              <div className="h-28 bg-slate-50 border border-slate-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error State
  if (error || !item) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-sm text-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={30} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Item Not Found</h3>
          <p className="text-sm mt-2 text-slate-500 max-w-md mx-auto leading-relaxed">
            {error || 'This post may have been removed, archived, or does not exist.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold shadow-xs hover:bg-slate-50 transition-colors"
            >
              Back to feed
            </button>
            <button
              onClick={loadData}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-xs hover:bg-primary-hover transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isLost = item.type === 'lost';
  const isReturned = item.status === 'returned';
  const ownerId = item.owner?._id || item.owner;
  const currentUserId = user?.id || user?._id;
  const isOwner = Boolean(user && ownerId && currentUserId && String(ownerId) === String(currentUserId));
  
  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  // Heading derived from existing color and category (for example 'Blue Backpack')
  const derivedHeading = (item.color && item.category && item.color !== 'other' && item.category !== 'other')
    ? `${formatColor(item.color)} ${formatCategory(item.category)}`
    : (item.category && item.category !== 'other' 
        ? formatCategory(item.category) 
        : (item.description || 'Campus Item'));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Top 'Back to feed' link */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover mb-6 transition-colors group cursor-pointer"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to feed</span>
      </button>

      {/* Main 2-Column Responsive Layout (55% details, 45% matches on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-20 gap-6 lg:gap-7 items-start">
        
        {/* ======================================================== */}
        {/* Left Column: Item Details (~55% width on desktop)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-11 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
          
          {/* Main Photo in rounded container with object-cover */}
          <div className="relative aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xs group mb-6">
            <img 
              src={item.imageUrl} 
              alt={item.description || derivedHeading}
              className="w-full h-full object-cover"
            />
            
            {/* Top Left Overlaid Badges (Lost/Found & Active/Returned) */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
              {isLost ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ffedd5] text-[#ea580c] border border-orange-200/90 shadow-xs backdrop-blur-xs">
                  <span className="w-4 h-4 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[10px] font-black">!</span>
                  <span>Lost Item</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d1fae5] text-[#059669] border border-emerald-200/90 shadow-xs backdrop-blur-xs">
                  <span className="w-4 h-4 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-black">✓</span>
                  <span>Found Item</span>
                </span>
              )}

              <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-xs backdrop-blur-xs ${
                isReturned 
                  ? 'bg-slate-100/95 text-slate-600 border border-slate-200' 
                  : 'bg-white/95 text-slate-700 border border-slate-200/70'
              }`}>
                {isReturned ? 'Returned' : 'Active'}
              </span>
            </div>

            {/* Top Right Expand Icon Button */}
            <button
              type="button"
              onClick={() => setShowImageLightbox(true)}
              title="View full image"
              aria-label="View full image"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 backdrop-blur-xs flex items-center justify-center shadow-xs border border-slate-200/60 transition-transform active:scale-95 cursor-pointer z-10"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          {/* Heading derived from existing color and category (for example 'Blue Backpack') */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3">
            {derivedHeading}
          </h1>

          {/* Category and Color Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Category badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
              {getCategoryIcon(item.category, 14)}
              <span>{formatCategory(item.category)}</span>
            </span>

            {/* Color badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
              <Palette size={14} className="text-blue-500" />
              <span>{formatColor(item.color)}</span>
            </span>

            {/* Verification protected badge (if item has private question) */}
            {item.privateQuestion && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Lock size={12} />
                <span>Verification Protected</span>
              </span>
            )}
          </div>

          {/* Full description (wrapping long text without clipping) */}
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words mb-5">
            {item.description || 'No additional description provided.'}
          </div>

          {/* Metadata: Location and Date separated by a subtle divider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t border-b border-slate-100 my-5">
            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Reported Location
                </span>
                <p className="text-sm font-bold text-slate-900 truncate" title={item.location}>
                  {item.location}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Reported Date
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>

          {/* 'Where it is now' for found items */}
          {item.type === 'found' && item.currentLocation && (
            <div className="mb-5 p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Package size={15} />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                  Where it is now
                </span>
                <p className="text-xs font-semibold text-teal-900 mt-0.5">
                  {item.currentLocation}
                </p>
              </div>
            </div>
          )}

          {/* Action Area: Contact / Resolution */}
          {isReturned ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-600 font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span>This item has been marked as returned to its owner.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              
              {/* Revealed Contact Box */}
              {revealedContact ? (
                <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Phone size={17} className="text-primary-brand" />
                      <span className="text-slate-700">Poster Contact:</span>
                      <span className="text-slate-900 font-extrabold select-all">{revealedContact}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyContact}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-primary-brand text-xs font-bold hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
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
                /* Full-width indigo Contact button */
                <button
                  type="button"
                  onClick={handleContactClick}
                  disabled={revealing}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {revealing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Retrieving contact...</span>
                    </>
                  ) : item.privateQuestion ? (
                    <>
                      <Lock size={18} />
                      <span>Answer Question to Contact Poster</span>
                    </>
                  ) : (
                    <>
                      <Phone size={18} />
                      <span>Contact the poster</span>
                    </>
                  )}
                </button>
              )}

              {/* Owner 'Mark as returned' button */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setReturnError(null);
                    setShowReturnModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <ShieldCheck size={15} className="text-slate-500" />
                  <span>Mark as returned</span>
                </button>
              )}

            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* Right Panel: Top Likely Matches (~45% width on desktop)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-9 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-primary-brand flex items-center justify-center flex-shrink-0">
                <Sparkles size={17} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Top Likely Matches
              </h2>
            </div>

            {/* Candidate count badge shown ONLY after matches have loaded (never a hardcoded 0) */}
            {!loading && (
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold select-none">
                {matches.length} {matches.length === 1 ? 'candidate' : 'candidates'}
              </span>
            )}
          </div>

          {/* Secondary explanation line */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2.5 mb-5">
            Our matching engine evaluates opposite-side active items across category, color, keywords, campus area, and report date.
          </p>

          {/* Content: Matches List or Visual Empty State */}
          {matches.length === 0 ? (
            /* Visual Empty State */
            <div className="py-6 px-4 text-center">
              
              {/* Illustrated Search Container */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-sky-50/80 border border-sky-100/80 flex items-center justify-center mx-auto my-3">
                {/* Decorative sparkles/dots */}
                <div className="absolute top-4 right-6 w-2 h-2 rounded-full bg-amber-400" />
                <div className="absolute bottom-6 left-6 w-2.5 h-2.5 rounded-full bg-primary-brand/30" />
                <div className="absolute top-8 left-5 w-1.5 h-1.5 rounded-full bg-sky-400" />

                <div className="relative flex items-center justify-center">
                  {/* Subtle document in background */}
                  <div className="absolute -right-3 -top-2 w-11 h-13 bg-white rounded-lg border border-slate-200/80 shadow-2xs p-1.5 flex flex-col gap-1 rotate-6">
                    <div className="w-5 h-1 bg-slate-300 rounded" />
                    <div className="w-7 h-1 bg-slate-200 rounded" />
                    <div className="w-4 h-1 bg-slate-200 rounded" />
                  </div>
                  {/* Search Icon */}
                  <Search size={42} className="text-primary-brand z-10 drop-shadow-xs" strokeWidth={2.3} />
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-3">
                No matches yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                We’ll automatically highlight candidate items as new reports are published on campus.
              </p>

              {/* Small Lightbulb Tip Card */}
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5 text-xs text-slate-700 flex items-start gap-2.5 mt-6 text-left">
                <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Tip:</strong> Adding specific description keywords (brand, stickers, marks) increases candidate match accuracy.
                </p>
              </div>
            </div>
          ) : (
            /* Match Cards with real data */
            <div className="flex flex-col gap-3.5">
              {matches.map((m) => (
                <MatchCard key={m.item._id} match={m} onSelect={onSelectMatch} />
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Image Lightbox Modal */}
      {showImageLightbox && (
        <div 
          onClick={() => setShowImageLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 cursor-default animate-fadeIn"
          >
            <button
              type="button"
              onClick={() => setShowImageLightbox(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center z-10 transition-colors shadow-md cursor-pointer"
              title="Close image"
            >
              <X size={18} />
            </button>
            <img 
              src={item.imageUrl} 
              alt={item.description || derivedHeading}
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Ownership Verification Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-brand/10 text-primary-brand flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Ownership Challenge</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChallengeModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              The finder has set a verification question to confirm rightful ownership before disclosing contact details:
            </p>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-left">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Question
              </span>
              <p className="text-sm font-bold text-slate-800 leading-snug">
                {item.privateQuestion}
              </p>
            </div>

            <form onSubmit={handleChallengeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all"
                />
              </div>

              {challengeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{challengeError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChallenge}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingChallenge && <Loader2 size={14} className="animate-spin" />}
                  <span>Verify &amp; Reveal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Resolution Modal (Owner Only) */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Mark as Returned</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure this item has been returned? Once confirmed, this item will be marked as returned and removed from the active campus feed and matches.
            </p>

            {returnError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span>{returnError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={markingReturned}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
              >
                {markingReturned && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm Return</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
