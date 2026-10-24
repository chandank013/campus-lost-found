import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Modal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmStyle = 'bg-primary text-white' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl transform transition-all">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-main">{title}</h3>
            <p className="text-sm text-text-muted mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-text-muted hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs active:scale-95 ${confirmStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
