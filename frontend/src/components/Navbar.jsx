import React from 'react';
import { GraduationCap, Search, Plus } from 'lucide-react';

export default function Navbar({ onNavigate }) {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: App Name (Clicking goes to feed) */}
        <div 
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-brand/10 text-primary-brand flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs flex-shrink-0">
            <GraduationCap size={24} className="text-primary-brand sm:w-6 sm:h-6" />
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5 text-lg sm:text-2xl font-black tracking-tight">
            <span className="text-slate-900">Campus</span>
            <span className="text-primary-brand hidden min-[440px]:inline">Lost &amp; Found</span>
          </div>
        </div>

        {/* Right: Dual Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => onNavigate('report', { type: 'lost' })}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex-shrink-0"
            title="I lost something"
          >
            <Search size={15} strokeWidth={2.5} />
            <span>
              <span className="hidden sm:inline">I lost </span>
              <span className="sm:hidden">Lost</span>
              <span className="hidden md:inline">something</span>
            </span>
          </button>

          <button
            onClick={() => onNavigate('report', { type: 'found' })}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex-shrink-0"
            title="I found something"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>
              <span className="hidden sm:inline">I found </span>
              <span className="sm:hidden">Found</span>
              <span className="hidden md:inline">something</span>
            </span>
          </button>
        </div>

      </div>
    </header>
  );
}
