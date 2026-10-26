import React from 'react';
import { GraduationCap, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer({ onNavigate }) {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const handleReportClick = (type = 'lost') => {
    if (!user) {
      // Redirect to login preserving intended reporting destination
      onNavigate('login', { redirect: `#/report?type=${type}` });
    } else {
      onNavigate('report', { type });
    }
  };

  return (
    <footer className="mt-auto bg-white border-t border-slate-200/80 text-xs text-slate-500 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-5">
          
          {/* Column 1: Brand Section (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-start pr-0 md:pr-6">
            <div 
              onClick={() => onNavigate('feed')}
              className="flex items-center gap-2 cursor-pointer group mb-1.5 select-none"
            >
              <div className="w-7 h-7 rounded-lg bg-primary-brand/10 text-primary-brand flex items-center justify-center transition-transform group-hover:scale-105">
                <GraduationCap size={18} className="text-primary-brand" />
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tight">
                Campus <span className="text-primary-brand">Lost &amp; Found</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm mb-2.5">
              A university community platform helping students and faculty quickly report, discover, and reconnect with missing belongings on campus.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Campus Recovery Network</span>
            </div>
          </div>

          {/* Column 2: Navigation Section (3 cols) */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('feed')}
                  className="text-slate-600 hover:text-primary-brand transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="text-slate-600 hover:text-primary-brand transition-colors cursor-pointer"
                >
                  About
                </button>
              </li>
              <li>
                <a
                  href="mailto:ck263022@gmail.com"
                  className="text-slate-600 hover:text-primary-brand transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Contact Support</span>
                  <ArrowUpRight size={11} className="text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Community & Reporting Section (4 cols) */}
          <div className="md:col-span-4">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
              Community
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-2">
              Found property on campus or missing an item? Submit a report to alert fellow students.
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => handleReportClick('lost')}
                  className="text-primary-brand hover:underline font-bold transition-colors cursor-pointer"
                >
                  &rarr; Report Lost Item
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleReportClick('found')}
                  className="text-emerald-600 hover:underline font-bold transition-colors cursor-pointer"
                >
                  &rarr; Report Found Item
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
          <p>
            &copy; {currentYear} Campus Lost &amp; Found. All rights reserved.
          </p>
          <p className="text-slate-400 font-medium">
            Campus Lost &amp; Found, a proof of concept.
          </p>
        </div>

      </div>
    </footer>
  );
}
