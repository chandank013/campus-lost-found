import React from 'react';
import { MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export default function ItemCard({ item, onClick }) {
  const isLost = item.type === 'lost';
  const isReturned = item.status === 'returned';

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      onClick={() => onClick(item._id)}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col group"
    >
      {/* 4:3 Aspect Ratio Photo Thumbnail */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img 
          src={item.imageUrl} 
          alt={item.description || `${item.color} ${item.category}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span 
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${
              isLost 
                ? 'bg-lost-bg text-lost-text border border-amber-300' 
                : 'bg-found-bg text-found-text border border-teal-300'
            }`}
          >
            {isLost ? 'Lost' : 'Found'}
          </span>

          {isReturned && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-returned-bg text-returned-text border border-slate-300 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Returned</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-chip-bg text-chip-text capitalize">
              {item.category}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 capitalize">
              {item.color}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm font-semibold text-text-main line-clamp-2 mb-3">
            {item.description || `Unspecified ${item.color} ${item.category}`}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <MapPin size={13} className="flex-shrink-0 text-slate-400" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Calendar size={13} className="text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
