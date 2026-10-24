import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="mt-auto py-6 sm:py-8 bg-white border-t border-slate-200/80 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
          <span className="font-bold text-slate-800">Campus Lost &amp; Found</span>
          <span className="hidden sm:inline text-slate-300">&bull;</span>
          <span className="text-slate-500">Campus Lost &amp; Found, a proof of concept.</span>
        </div>
        <div className="flex items-center gap-5 font-semibold text-slate-600">
          <button
            onClick={() => onNavigate('about')}
            className="hover:text-primary-brand transition-colors cursor-pointer"
          >
            About
          </button>
          <span className="text-slate-300">&bull;</span>
          <a
            href="mailto:ck263022@gmail.com"
            className="hover:text-primary-brand transition-colors cursor-pointer"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
