import React from 'react';
import { Compass, PlusCircle } from 'lucide-react';

export default function Navbar({ onNavigate }) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* App Title */}
        <div 
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Compass size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main tracking-tight leading-none">
              Campus Lost & Found
            </h1>
            <span className="text-xs text-text-muted font-medium">Community Recovery Board</span>
          </div>
        </div>

        {/* Dual Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('report', { type: 'lost' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-lost-bg text-lost-text border border-amber-300 font-semibold text-sm hover:brightness-95 transition-all shadow-sm active:scale-95"
          >
            <PlusCircle size={16} />
            <span>I lost something</span>
          </button>

          <button
            onClick={() => onNavigate('report', { type: 'found' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all shadow-sm active:scale-95"
          >
            <PlusCircle size={16} />
            <span>I found something</span>
          </button>
        </div>
      </div>
    </header>
  );
}
