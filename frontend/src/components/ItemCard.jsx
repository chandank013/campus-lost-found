import React, { useState } from 'react';
import { MapPin, Calendar, Check, AlertCircle, ImageOff } from 'lucide-react';

export default function ItemCard({ item, onClick }) {
  const [imgError, setImgError] = useState(false);
  const isLost = item.type === 'lost';
  const isReturned = item.status === 'returned';

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  // Generate a clean item title matching the design reference style
  const getCardTitle = () => {
    if (!item.description) {
      return `${capitalize(item.color)} ${capitalize(item.category)}`;
    }
    // If description has a clear first sentence or clause, use it if short, else color + category
    const firstClause = item.description.split(/[,.\n]/)[0].trim();
    if (firstClause.length >= 4 && firstClause.length <= 32) {
      return firstClause;
    }
    return `${capitalize(item.color)} ${capitalize(item.category)}`;
  };

  const capitalize = (str) => {
    if (!str || str === 'other') return 'Item';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div 
      onClick={() => onClick(item._id)}
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col sm:flex-row gap-4.5 group select-none"
    >
      {/* Photo Thumbnail */}
      <div className="w-full sm:w-36 sm:h-36 md:w-40 md:h-40 h-48 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative border border-slate-100">
        {!imgError ? (
          <img 
            src={item.imageUrl} 
            alt={item.description || `${item.color} ${item.category}`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-2 text-center">
            <ImageOff size={24} className="mb-1 text-slate-300" />
            <span className="text-[10px] font-semibold text-slate-400">Photo Unavailable</span>
          </div>
        )}
      </div>

      {/* Right Column: Information */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Top Row: Lost/Found Badge & Status Chip */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {isLost ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffedd5] text-[#ea580c] border border-orange-200">
                <span className="w-3.5 h-3.5 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[10px] font-black">!</span>
                <span>Lost</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d1fae5] text-[#059669] border border-emerald-200">
                <span className="w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-black">✓</span>
                <span>Found</span>
              </span>
            )}

            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isReturned 
                ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {isReturned ? 'Returned' : 'Active'}
            </span>
          </div>

          {/* Item Title */}
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-1 mb-2 group-hover:text-primary-brand transition-colors">
            {getCardTitle()}
          </h3>

          {/* Tag Chips Row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ede9fe] text-[#4f46e5] capitalize">
              {item.category === 'other' ? 'Uncategorized' : item.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e0f2fe] text-[#0284c7] capitalize">
              {item.color === 'other' ? 'Mixed / Other' : item.color}
            </span>
          </div>

          {/* Truncated Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {item.description || `Reported ${item.type} item near ${item.location}.`}
          </p>
        </div>

        {/* Card Footer: Location & Date */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5 truncate max-w-[60%]">
            <MapPin size={13} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-500">
            <Calendar size={13} className="text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
