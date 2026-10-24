import React, { useState } from 'react';
import { MapPin, Calendar, ImageOff } from 'lucide-react';

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
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group select-none grid grid-cols-1 sm:grid-cols-[135px_minmax(0,1fr)] lg:grid-cols-[130px_minmax(0,1fr)] xl:grid-cols-[140px_minmax(0,1fr)] gap-4 items-stretch overflow-hidden box-border"
    >
      {/* 1. Image Section (Occupies its own dedicated grid column, never overlaps content) */}
      <div className="w-full h-48 sm:h-full sm:min-h-[145px] rounded-xl overflow-hidden bg-slate-100 relative border border-slate-100 flex-shrink-0">
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
            <ImageOff size={22} className="mb-1 text-slate-300" />
            <span className="text-[10px] font-semibold text-slate-400">Photo Unavailable</span>
          </div>
        )}
      </div>

      {/* 2. Content Section (Strictly in column 2, min-w-0 prevents any overflow or underflow) */}
      <div className="min-w-0 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Top Row: Lost/Found Badge & Status Chip */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
            {isLost ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffedd5] text-[#ea580c] border border-orange-200 flex-shrink-0">
                <span className="w-3.5 h-3.5 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[10px] font-black">!</span>
                <span>Lost</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d1fae5] text-[#059669] border border-emerald-200 flex-shrink-0">
                <span className="w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-black">✓</span>
                <span>Found</span>
              </span>
            )}

            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              isReturned 
                ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {isReturned ? 'Returned' : 'Active'}
            </span>
          </div>

          {/* Item Title */}
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug truncate mb-2 group-hover:text-primary-brand transition-colors">
            {getCardTitle()}
          </h3>

          {/* Category & Color Tag Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ede9fe] text-[#4f46e5] capitalize truncate max-w-[120px]">
              {item.category === 'other' ? 'Uncategorized' : item.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e0f2fe] text-[#0284c7] capitalize truncate max-w-[120px]">
              {item.color === 'other' ? 'Mixed' : item.color}
            </span>
          </div>

          {/* Truncated Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 break-words">
            {item.description || `Reported ${item.type} item near ${item.location}.`}
          </p>
        </div>

        {/* Card Footer: Location & Date (Bounded and cleanly aligned) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <MapPin size={13} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-500 whitespace-nowrap">
            <Calendar size={13} className="text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
