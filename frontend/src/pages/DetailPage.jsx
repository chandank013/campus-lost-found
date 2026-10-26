import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ArrowLeft, MapPin, Calendar, Check, Phone, Copy, 
  Sparkles, AlertCircle, Loader2, ShieldCheck, ArrowRight, Package,
  Lock, CheckCircle2, X, LogIn, Maximize2, Lightbulb, Smartphone,
  Laptop, ShoppingBag, Droplet, Umbrella, BookOpen, Tag, Palette, Headphones
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import MatchCard from '../components/MatchCard';

/**
 * Category icon helper matching supported item types
 */
const getCategoryIcon = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('earbud') || cat.includes('airphone') || cat.includes('hearphone') || cat.includes('headphone')) return <Headphones size={13} />;
  if (cat.includes('phone')) return <Smartphone size={13} />;
  if (cat.includes('laptop')) return <Laptop size={13} />;
  if (cat.includes('bag')) return <ShoppingBag size={13} />;
  if (cat.includes('bottle')) return <Droplet size={13} />;
  if (cat.includes('umbrella')) return <Umbrella size={13} />;
  if (cat.includes('book')) return <BookOpen size={13} />;
  return <Tag size={13} />;
};

/**
 * Polished empty state illustration replicating the reference design
 * (Soft circular background with magnifying glass, document preview, and sparkle stars)
 */
function MatchesEmptyIllustration() {
  return (
    <div className="relative w-44 h-40 mx-auto flex items-center justify-center my-3 select-none">
      {/* Soft circular backdrop */}
      <div className="absolute w-36 h-36 rounded-full bg-[#f0f5ff] -z-0"></div>

      {/* Floating document preview */}
      <div className="absolute right-9 top-8 w-18 h-20 bg-white rounded-xl border border-slate-100 shadow-sm p-2.5 flex flex-col justify-center gap-1.5 z-10 transform translate-x-2">
        <div className="w-9 h-1.5 bg-slate-200 rounded-full"></div>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        <div className="w-7 h-1.5 bg-slate-200 rounded-full"></div>
      </div>

      {/* Royal blue magnifying glass */}
      <div className="absolute left-9 top-6 z-20">
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="19" stroke="#1d2b85" strokeWidth="6" fill="#ffffff" />
          <path d="M18 20C20 16 26 14 31 16" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M42 42L57 57" stroke="#1d2b85" strokeWidth="7" strokeLinecap="round" />
        </svg>
      </div>

      {/* Subtle sparkle stars */}
      <div className="absolute right-12 top-3 z-10 text-amber-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
        </svg>
      </div>
      <div className="absolute right-7 top-9 z-10 text-amber-300">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
        </svg>
      </div>
      <div className="absolute left-8 bottom-8 z-10 text-blue-400">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
        </svg>
      </div>
    </div>
  );
}

export default function DetailPage({ itemId, onBack, onSelectMatch, onNavigate }) {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fullscreen image expand lightbox
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

  // Handle escape key to close image lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowImageLightbox(false);
        setShowChallengeModal(false);
        setShowReturnModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      try {
        await fetchNotifications();
      } catch {}
    } catch (err) {
      setReturnError(err.response?.data?.error || err.response?.data?.message || 'Failed to mark item returned.');
    } finally {
      setMarkingReturned(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 size={36} className="animate-spin text-primary-brand mb-3" />
        <p className="text-sm font-semibold">Loading item details and scanning for matches...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs text-slate-800">
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
  const ownerId = item.owner?._id || item.owner?.id || item.owner;
  const currentUserId = user?.id || user?._id;
  const ownerEmail = typeof item.owner === 'object' ? item.owner?.email : null;
  const currentUserEmail = user?.email;
  const isOwner = Boolean(
    user && (
      (ownerId && currentUserId && String(ownerId) === String(currentUserId)) ||
      (ownerEmail && currentUserEmail && ownerEmail.toLowerCase() === currentUserEmail.toLowerCase())
    )
  );
  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-sans">
      
      {/* Main 2-Column Responsive Layout (~55% Left / ~45% Right) */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 items-start">
        
        {/* LEFT COLUMN: Item Details Card (~55% on desktop) */}
        <div className="w-full lg:w-[55%] flex-shrink-0 bg-white border border-slate-200/80 rounded-[24px] p-5 sm:p-6 shadow-xs">
          
          {/* Item Image Container with Rounded Corners */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group">
            <img 
              src={item.imageUrl} 
              alt={item.description || `${item.color} ${item.category}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />

            {/* Overlaid Badges (Lost/Found & Active) */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
              {isLost ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ffedd5] text-[#ea580c] shadow-xs">
                  <span className="w-4 h-4 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[10px] font-black leading-none">!</span>
                  <span>Lost Item</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d1fae5] text-[#059669] shadow-xs">
                  <span className="w-4 h-4 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-black leading-none">✓</span>
                  <span>Found Item</span>
                </span>
              )}

              <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-xs backdrop-blur-2xs ${
                isReturned 
                  ? 'bg-slate-100/95 text-slate-600 border border-slate-200' 
                  : 'bg-white/95 text-slate-800'
              }`}>
                {isReturned ? 'Returned' : 'Active'}
              </span>
            </div>

            {/* Expand Image Control Button */}
            <button
              type="button"
              onClick={() => setShowImageLightbox(true)}
              className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 shadow-xs backdrop-blur-xs transition-all z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              title="Expand image"
              aria-label="Expand image preview"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Item Information Section */}
          <div className="pt-5 sm:pt-6">
            
            {/* Primary Heading / Item Title */}
            <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-snug mb-3">
              {item.description || `Unspecified ${item.color} ${item.category}`}
            </h1>

            {/* Category, Color, and Verification Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#ede9fe] text-[#4f46e5]">
                {getCategoryIcon(item.category)}
                <span className="capitalize">{item.category}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#e0f2fe] text-[#0284c7]">
                <Palette size={13} />
                <span className="capitalize">{item.color}</span>
              </span>

              {item.privateQuestion && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock size={12} />
                  <span>Verification Protected</span>
                </span>
              )}
            </div>

            {/* Item Description Text */}
            <p className="text-sm text-slate-600 leading-relaxed font-normal mb-5">
              {item.description || `Reported ${item.type} item: ${item.color} ${item.category}.`}
            </p>

            {/* Custody Information (Found Items Only) */}
            {item.currentLocation && (
              <div className="mb-5 p-3.5 bg-teal-50/70 border border-teal-200/70 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package size={17} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-teal-900 uppercase tracking-wider">Item Custody</span>
                  <p className="text-xs sm:text-sm font-semibold text-teal-800 mt-0.5">{item.currentLocation}</p>
                </div>
              </div>
            )}

            {/* Metadata Section: Reported Location & Reported Date separated by a subtle divider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">REPORTED LOCATION</span>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5" title={item.location}>
                    {item.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">REPORTED DATE</span>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                    {formattedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Action Flow */}
            {isReturned ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-600 font-semibold text-sm flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
                <span>This item has been marked as returned to its owner.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                
                {/* Contact Revealed Card */}
                {revealedContact ? (
                  <div className="p-4.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <Phone size={16} className="text-primary-brand" />
                        <span className="text-slate-700">Poster Contact:</span>
                        <span className="text-slate-900 font-extrabold select-all">{revealedContact}</span>
                      </div>
                      <button
                        onClick={handleCopyContact}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-primary-brand text-xs font-bold hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied!' : 'Copy Contact'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                      💡 <strong>Verification Tip:</strong> Ask them to describe one detail that isn’t obvious in the photo (like internal contents or a distinctive scratch) before handing over the item.
                    </p>
                  </div>
                ) : (
                  /* Prominent Full-Width Contact Button */
                  <button
                    onClick={handleContactClick}
                    disabled={revealing}
                    className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#1d2b85] hover:bg-[#16226b] text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d2b85]"
                  >
                    {revealing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : item.privateQuestion ? (
                      <Lock size={18} />
                    ) : (
                      <Phone size={18} />
                    )}
                    <span>
                      {item.privateQuestion ? 'Answer Question to Contact Poster' : 'Contact the poster'}
                    </span>
                  </button>
                )}

                {/* Mark as Returned Button (Shown only to the item owner) */}
                {isOwner && (
                  <button
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

        </div>

        {/* RIGHT COLUMN: Top Likely Matches Panel (~45% on desktop) */}
        <div className="w-full lg:w-[45%] flex-1 min-w-0 bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-primary-brand" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Top Likely Matches
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 whitespace-nowrap">
              {matches.length} {matches.length === 1 ? 'candidate' : 'candidates'}
            </span>
          </div>

          {/* Engine Explanation Description */}
          <p className="text-xs text-slate-500 leading-relaxed mt-3.5 mb-5">
            Our matching engine evaluates opposite-side active items across category, color, keywords, campus area, and report date.
          </p>

          {/* Match Results or Polished Empty State */}
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2 sm:py-4">
              {/* Graphic Illustration */}
              <MatchesEmptyIllustration />

              {/* Empty State Heading */}
              <h3 className="text-lg font-bold text-slate-900 text-center mb-1 mt-1">
                No matches yet
              </h3>

              {/* Supporting explanation text */}
              <p className="text-xs text-slate-500 text-center max-w-xs mx-auto leading-relaxed mb-4">
                We’ll automatically highlight candidate items as new reports are published on campus.
              </p>

              {/* Compact Tip Card */}
              <div className="w-full mt-2 p-3.5 sm:p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
                <div className="w-6 h-6 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb size={14} />
                </div>
                <p className="leading-relaxed">
                  <strong className="font-bold text-slate-800">Tip:</strong> Adding specific description keywords (brand, stickers, marks) increases candidate match accuracy.
                </p>
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

      {/* Lightbox Image Preview Modal */}
      {showImageLightbox && (
        <div 
          onClick={() => setShowImageLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setShowImageLightbox(false)}
                className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-md"
                aria-label="Close image preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[80vh] flex items-center justify-center bg-slate-950">
              <img 
                src={item.imageUrl} 
                alt={item.description || item.category} 
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="p-4 bg-white flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{item.description || `${item.color} ${item.category}`}</span>
              <span>{item.location} &bull; {formattedDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Ownership Verification Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-fadeIn">
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

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-left">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-fadeIn">
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
