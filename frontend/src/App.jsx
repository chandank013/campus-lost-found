import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FeedPage from './pages/FeedPage';
import ReportPage from './pages/ReportPage';
import DetailPage from './pages/DetailPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyPostsPage from './pages/MyPostsPage';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';
import { GuestRoute, ProtectedRoute, LoadingSpinner } from './components/RouteGuards';

export default function App() {
  const { loading } = useAuth();
  const [view, setView] = useState('feed'); // 'feed' | 'report' | 'detail' | 'about' | 'login' | 'register' | 'profile' | 'my-posts'
  const [reportType, setReportType] = useState('lost');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);

  // Sync with browser history and hash navigation
  useEffect(() => {
    const handleLocationChange = () => {
      let route = window.location.hash;
      if (!route && window.location.pathname !== '/') {
        route = `#${window.location.pathname}${window.location.search}`;
      }

      if (route.startsWith('#/items/')) {
        const id = route.replace('#/items/', '').split('?')[0];
        setSelectedItemId(id);
        setView('detail');
      } else if (route.startsWith('#/report')) {
        const params = new URLSearchParams(route.split('?')[1]);
        setReportType(params.get('type') || 'lost');
        setView('report');
      } else if (route.startsWith('#/login')) {
        const params = new URLSearchParams(route.split('?')[1]);
        setRedirectUrl(params.get('redirect') || null);
        setView('login');
      } else if (route.startsWith('#/register')) {
        const params = new URLSearchParams(route.split('?')[1]);
        setRedirectUrl(params.get('redirect') || null);
        setView('register');
      } else if (route.startsWith('#/profile') || route.startsWith('#/my-posts')) {
        setView('profile');
      } else if (route.startsWith('#/about')) {
        setView('about');
      } else {
        setView('feed');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    handleLocationChange(); // initial load

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (newView, params = {}) => {
    if (newView === 'feed') {
      window.location.hash = '#/';
      setView('feed');
    } else if (newView === 'report') {
      const t = params.type || 'lost';
      setReportType(t);
      window.location.hash = `#/report?type=${t}`;
      setView('report');
    } else if (newView === 'detail') {
      setSelectedItemId(params.id);
      window.location.hash = `#/items/${params.id}`;
      setView('detail');
    } else if (newView === 'about') {
      window.location.hash = '#/about';
      setView('about');
    } else if (newView === 'login') {
      const red = params.redirect ? `?redirect=${encodeURIComponent(params.redirect)}` : '';
      window.location.hash = `#/login${red}`;
      setRedirectUrl(params.redirect || null);
      setView('login');
    } else if (newView === 'register') {
      const red = params.redirect ? `?redirect=${encodeURIComponent(params.redirect)}` : '';
      window.location.hash = `#/register${red}`;
      setRedirectUrl(params.redirect || null);
      setView('register');
    } else if (newView === 'profile' || newView === 'my-posts') {
      window.location.hash = '#/profile';
      setView('profile');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // While restoring session on first load, avoid flash or redirect loops
  if (loading) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center font-sans">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page flex flex-col font-sans selection:bg-primary-light selection:text-primary-brand">
      <Navbar onNavigate={navigateTo} currentView={view} />

      <div className="flex-1">
        {view === 'feed' && (
          <FeedPage 
            onSelectItem={(id) => navigateTo('detail', { id })} 
            onNavigate={navigateTo}
          />
        )}

        {view === 'report' && (
          <ProtectedRoute>
            <ReportPage 
              initialType={reportType} 
              onBack={() => navigateTo('feed')}
              onSuccess={(id) => navigateTo('detail', { id })}
              onNavigate={navigateTo}
            />
          </ProtectedRoute>
        )}

        {view === 'detail' && (
          <DetailPage 
            itemId={selectedItemId} 
            onBack={() => navigateTo('feed')}
            onSelectMatch={(id) => navigateTo('detail', { id })}
            onNavigate={navigateTo}
          />
        )}

        {view === 'about' && (
          <AboutPage onBack={() => navigateTo('feed')} />
        )}

        {view === 'login' && (
          <GuestRoute>
            <LoginPage 
              onNavigate={navigateTo} 
              redirectUrl={redirectUrl} 
            />
          </GuestRoute>
        )}

        {view === 'register' && (
          <GuestRoute>
            <RegisterPage 
              onNavigate={navigateTo} 
              redirectUrl={redirectUrl} 
            />
          </GuestRoute>
        )}

        {(view === 'profile' || view === 'my-posts') && (
          <ProtectedRoute>
            <ProfilePage 
              onSelectItem={(id) => navigateTo('detail', { id })} 
              onNavigate={navigateTo} 
            />
          </ProtectedRoute>
        )}
      </div>

      {/* Simple Global Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
