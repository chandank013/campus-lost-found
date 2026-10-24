import React, { useState } from 'react';
import { GraduationCap, Search, Plus, Menu, X, Info, PhoneCall } from 'lucide-react';

export default function Navbar({ onNavigate, currentView = 'feed' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleNav = (view, params = {}) => {
    setMobileMenuOpen(false);
    onNavigate(view, params);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Title */}
          <div 
            onClick={() => handleNav('feed')}
            className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-brand/10 text-primary-brand flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <GraduationCap size={26} className="text-primary-brand" />
            </div>
            <div className="flex items-baseline gap-1.5 text-2xl font-black tracking-tight">
              <span className="text-slate-900">Campus</span>
              <span className="text-primary-brand">Lost &amp; Found</span>
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-full border border-slate-200/60 text-sm font-semibold">
            <button
              onClick={() => handleNav('feed')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                currentView === 'feed'
                  ? 'bg-primary-light text-primary-brand shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('feed')}
              className="px-4 py-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Browse
            </button>
            <button
              onClick={() => setShowAboutModal(true)}
              className="px-4 py-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-4 py-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Right: Dual Action Buttons */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => handleNav('report', { type: 'lost' })}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-sm transition-all active:scale-95"
            >
              <Search size={16} strokeWidth={2.5} />
              <span>I lost something</span>
            </button>

            <button
              onClick={() => handleNav('report', { type: 'found' })}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-sm transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>I found something</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 flex flex-col gap-3 shadow-lg animate-fadeIn">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <button
                onClick={() => handleNav('feed')}
                className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                  currentView === 'feed' ? 'bg-primary-light text-primary-brand font-bold' : 'text-slate-700'
                }`}
              >
                Home / Browse
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowAboutModal(true); }}
                className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                About
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowContactModal(true); }}
                className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Contact
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleNav('report', { type: 'lost' })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-sm"
              >
                <Search size={16} strokeWidth={2.5} />
                <span>I lost something</span>
              </button>
              <button
                onClick={() => handleNav('report', { type: 'found' })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-sm"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>I found something</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-brand/10 text-primary-brand flex items-center justify-center">
                  <Info size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">About Campus Lost &amp; Found</h3>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>Campus Lost &amp; Found</strong> is an open campus recovery community connecting students and faculty with their missing belongings.
              </p>
              <p>
                Featuring on-device AI tagging (YOLOv8 + OpenCV) and an explainable matching algorithm, our platform immediately highlights potential matches while strictly protecting student privacy.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                🔒 Privacy Guarantee: Contact information is hidden from the public feed and revealed only when someone explicitly requests to contact the poster.
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-xs hover:bg-primary-hover"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-brand/10 text-primary-brand flex items-center justify-center">
                  <PhoneCall size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Campus Helpdesk &amp; Security</h3>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>If you have found high-value items (laptops, wallets, government IDs), you can also submit them directly to physical campus offices:</p>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="block text-slate-800 text-sm">Central Library Front Desk</strong>
                  <span className="text-slate-500">Main Quad, Ground Floor &bull; Open 8:00 AM - 10:00 PM</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="block text-slate-800 text-sm">Campus Security Office</strong>
                  <span className="text-slate-500">Main Gate Admin Block &bull; Available 24/7 &bull; Ext: 101</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-xs hover:bg-primary-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
