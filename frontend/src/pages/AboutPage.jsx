import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';

export default function AboutPage({ onBack }) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        <span>Back to feed</span>
      </button>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light text-primary-brand text-xs font-extrabold uppercase tracking-wider mb-4 border border-indigo-100">
          <Info size={13} />
          <span>About the Project</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          Campus Lost &amp; Found
        </h1>

        <div className="text-base text-slate-600 leading-relaxed space-y-4 font-normal">
          <p>
            Campus Lost &amp; Found is a proof-of-concept application designed to help students and campus staff quickly recover misplaced belongings by posting a photo with automatic category and color suggestions.
          </p>
          <p>
            When an item is reported, our rule-based matching engine scores candidate items and surfaces the top 3 matches with transparent reasons explaining each score.
          </p>
          <p>
            Please note that the computer vision detector recognizes common everyday objects only.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Questions or feedback?{' '}
            <a 
              href="mailto:ck263022@gmail.com" 
              className="font-bold text-primary-brand hover:underline"
            >
              Contact via Email
            </a>
          </div>

          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-all active:scale-95 text-center"
          >
            Back to feed
          </button>
        </div>
      </div>
    </main>
  );
}
