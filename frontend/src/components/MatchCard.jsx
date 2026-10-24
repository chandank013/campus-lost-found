import React from 'react';
import { MapPin, Calendar, Sparkles, ShoppingBag, Droplets, ArrowRight } from 'lucide-react';

export default function MatchCard({ match, onSelect }) {
  const { item, score, tier, reasons } = match;
  const isLost = item.type === 'lost';

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  const getTierBadge = () => {
    switch (tier) {
      case 'Strong match':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'Good match':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400'
        };
    }
  };

  const getReasonIcon = (reasonText) => {
    const text = reasonText.toLowerCase();
    if (text.includes('category')) return <ShoppingBag size={12} className="text-primary-brand" />;
    if (text.includes('color')) return <Droplets size={12} className="text-teal-600" />;
    if (text.includes('keyword')) return <Sparkles size={12} className="text-amber-500" />;
    if (text.includes('location')) return <MapPin size={12} className="text-indigo-500" />;
    if (text.includes('date')) return <Calendar size={12} className="text-blue-500" />;
    return <Sparkles size={12} className="text-slate-500" />;
  };

  const tierStyle = getTierBadge();

  return (
    <div 
      onClick={() => onSelect(item._id)}
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col gap-3 group select-none"
    >
      <div className="flex gap-3.5 items-start">
        {/* Thumbnail */}
        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative border border-slate-100">
          <img 
            src={item.imageUrl} 
            alt={item.description || item.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info & Tier */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            {isLost ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffedd5] text-[#ea580c] border border-orange-200">
                <span className="w-3 h-3 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[8px] font-black">!</span>
                <span>Lost</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d1fae5] text-[#059669] border border-emerald-200">
                <span className="w-3 h-3 rounded-full bg-[#059669] text-white flex items-center justify-center text-[8px] font-black">✓</span>
                <span>Found</span>
              </span>
            )}

            {/* Match Tier Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierStyle.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
              <span>{tier} ({score} pts)</span>
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-primary-brand transition-colors">
            {item.description || `${item.color} ${item.category}`}
          </h4>

          <div className="flex items-center gap-2 text-xs text-slate-500">
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
        </div>
      </div>

      {/* Applied Reason Chips */}
      {reasons && reasons.length > 0 && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
          {reasons.map((reason, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/60"
            >
              {getReasonIcon(reason)}
              <span>{reason}</span>
            </span>
          ))}
        </div>
      )}

      {/* View Details Link */}
      <div className="pt-1 flex items-center justify-end text-xs font-bold text-primary-brand group-hover:translate-x-0.5 transition-transform gap-1">
        <span>View match details</span>
        <ArrowRight size={13} />
      </div>
    </div>
  );
}
