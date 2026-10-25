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

export default function App() {
  const [view, setView] = useState('feed'); // 'feed' | 'report' | 'detail' | 'about' | 'login' | 'register' | 'my-posts'
  const [reportType, setReportType] = useState('lost');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);

  // Sync with browser history and hash navigation
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/items/')) {
        const id = hash.replace('#/items/', '');
        setSelectedItemId(id);
        setView('detail');
      } else if (hash.startsWith('#/report')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        setReportType(params.get('type') || 'lost');
        setView('report');
      } else if (hash.startsWith('#/login')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        setRedirectUrl(params.get('redirect') || null);
        setView('login');
      } else if (hash.startsWith('#/register')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        setRedirectUrl(params.get('redirect') || null);
        setView('register');
      } else if (hash.startsWith('#/my-posts')) {
        setView('my-posts');
      } else if (hash.startsWith('#/about')) {
        setView('about');
      } else {
        setView('feed');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // initial load

    return () => window.removeEventListener('popstate', handlePopState);
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
    } else if (newView === 'my-posts') {
      window.location.hash = '#/my-posts';
      setView('my-posts');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-page flex flex-col font-sans selection:bg-primary-light selection:text-primary-brand">
      <Navbar onNavigate={navigateTo} />

      <div className="flex-1">
        {view === 'feed' && (
          <FeedPage 
            onSelectItem={(id) => navigateTo('detail', { id })} 
            onNavigate={navigateTo}
          />
        )}

        {view === 'report' && (
          <ReportPage 
            initialType={reportType} 
            onBack={() => navigateTo('feed')}
            onSuccess={(id) => navigateTo('detail', { id })}
            onNavigate={navigateTo}
          />
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
          <LoginPage 
            onNavigate={navigateTo} 
            redirectUrl={redirectUrl} 
          />
        )}

        {view === 'register' && (
          <RegisterPage 
            onNavigate={navigateTo} 
            redirectUrl={redirectUrl} 
          />
        )}

        {view === 'my-posts' && (
          <MyPostsPage 
            onSelectItem={(id) => navigateTo('detail', { id })} 
            onNavigate={navigateTo} 
          />
        )}
      </div>

      {/* Simple Global Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
