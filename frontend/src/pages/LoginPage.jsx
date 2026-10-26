import React, { useState, useEffect } from 'react';
import { GraduationCap, AlertCircle, CheckCircle2, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onNavigate, redirectUrl = null, initialEmail = '', successMessage = null }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(successMessage);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check URL parameters for registration confirmation & prefilled email
    try {
      const hash = window.location.hash || '';
      if (hash.includes('?')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        if (params.get('registered') === 'true') {
          setInfoMessage('Account registered successfully! Please log in with your email and password to continue.');
        }
        if (params.get('email')) {
          setEmail(params.get('email'));
        }
      }
    } catch {}

    if (initialEmail) setEmail(initialEmail);
    if (successMessage) setInfoMessage(successMessage);
  }, [initialEmail, successMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your campus email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      // Redirect after successful login
      if (redirectUrl) {
        if (redirectUrl.startsWith('#/')) {
          window.location.hash = redirectUrl;
        } else {
          window.location.hash = `#/${redirectUrl.replace(/^\/?/, '')}`;
        }
      } else {
        onNavigate('feed');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80">
        
        {/* Header */}
        <div className="text-center pb-6 mb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-primary-brand/10 text-primary-brand flex items-center justify-center mx-auto mb-3 shadow-xs">
            <GraduationCap size={26} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Log in to Campus Lost &amp; Found
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Access your posted items, contact finders, and manage returns
          </p>
        </div>

        {/* Registration Success notice */}
        {infoMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="font-bold leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {/* Error message banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Campus Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer switch to Register */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600 font-medium">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('register', { redirect: redirectUrl })}
              className="text-primary-brand font-bold hover:underline ml-1"
            >
              Register here
            </button>
          </p>
        </div>

      </div>
    </main>
  );
}
