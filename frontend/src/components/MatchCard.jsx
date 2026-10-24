import React from 'react';
import { MapPin, Calendar, Sparkles } from 'lucide-react';

export default function MatchCard({ match, onSelect }) {
  const { item, score, tier, reasons } = match;
  const isLost = item.type === 'lost';

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const getTierColor = (t) => {
    switch (t) {
      case 'Strong match':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Good match':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div 
      onClick={() => onSelect(item._id)}
      className="bg-card border border-border rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col gap-3 group"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative">
          <img 
            src={item.imageUrl} 
            alt={item.description || item.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Info & Tier Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span 
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isLost ? 'bg-lost-bg text-lost-text' : 'bg-found-bg text-found-text'
              }`}
            >
              {isLost ? 'Lost' : 'Found'}
            </span>

            {/* Match Tier Badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getTierColor(tier)}`}>
              <Sparkles size={11} />
              <span>{tier}</span>
            </span>
          </div>

          <p className="text-sm font-semibold text-text-main line-clamp-1 mb-1">
            {item.description || `${item.color} ${item.category}`}
          </p>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="truncate flex items-center gap-0.5">
              <MapPin size={11} />
              {item.location}
            </span>
            <span>•</span>
            <span className="flex-shrink-0 flex items-center gap-0.5">
              <Calendar size={11} />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Reason Chips */}
      {reasons && reasons.length > 0 && (
        <div className="pt-2 border-t border-border flex flex-wrap gap-1.5">
          {reasons.map((reason, idx) => (
            <span 
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-chip-bg text-chip-text"
            >
              ✓ {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
