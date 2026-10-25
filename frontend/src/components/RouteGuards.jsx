import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Navigate component for declarative redirects.
 * Defaults to redirecting to the feed ('/') using replace.
 */
export function Navigate({ to = '/', replace = true }) {
  useEffect(() => {
    let target = to;
    if (target === '/') {
      target = '#/';
    } else if (!target.startsWith('#')) {
      target = `#/${target.replace(/^\//, '')}`;
    }

    if (replace) {
      window.location.replace(target);
      try {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (e) {
        window.dispatchEvent(new Event('hashchange'));
      }
    } else {
      window.location.hash = target;
    }
  }, [to, replace]);

  return null;
}

/**
 * Simple Loading Spinner while auth session is restoring on first load.
 */
export function LoadingSpinner() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
        Loading...
      </p>
    </div>
  );
}

/**
 * GuestRoute: Guest-only route guard.
 * If a logged-in user opens /login or /register (by URL, bookmark, or browser Back button),
 * redirects them to the feed (/) using <Navigate replace /> so the Back button doesn't bounce them.
 * Logged-out users can open the route normally.
 * When a user logs in or registers on the page, the guard does NOT hijack the post-login redirect.
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const wasLoggedInOnMount = useRef(null);

  if (!loading && wasLoggedInOnMount.current === null) {
    wasLoggedInOnMount.current = Boolean(user);
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  // Arrived while already authenticated (direct URL, bookmark, or Back button) -> redirect to feed
  if (wasLoggedInOnMount.current) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * ProtectedRoute: Guard for routes requiring authentication (/report, /my-posts).
 * If a logged-out user opens the route, redirects them to /login with the return destination,
 * so they are brought back after authenticating.
 */
export function ProtectedRoute({ children, fallbackRedirect }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    const returnTarget = fallbackRedirect || window.location.hash || '#/';
    const loginTarget = `#/login?redirect=${encodeURIComponent(returnTarget)}`;
    return <Navigate to={loginTarget} replace />;
  }

  return children;
}
