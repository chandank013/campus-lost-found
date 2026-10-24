import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FeedPage from './pages/FeedPage';
import ReportPage from './pages/ReportPage';
import DetailPage from './pages/DetailPage';

export default function App() {
  const [view, setView] = useState('feed'); // 'feed' | 'report' | 'detail'
  const [reportType, setReportType] = useState('lost');
  const [selectedItemId, setSelectedItemId] = useState(null);

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
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Navbar onNavigate={navigateTo} />

      <div className="flex-1">
        {view === 'feed' && (
          <FeedPage onSelectItem={(id) => navigateTo('detail', { id })} />
        )}

        {view === 'report' && (
          <ReportPage 
            initialType={reportType} 
            onBack={() => navigateTo('feed')}
            onSuccess={(id) => navigateTo('detail', { id })}
          />
        )}

        {view === 'detail' && (
          <DetailPage 
            itemId={selectedItemId} 
            onBack={() => navigateTo('feed')}
            onSelectMatch={(id) => navigateTo('detail', { id })}
          />
        )}
      </div>

      {/* Campus Footer */}
      <footer className="mt-auto py-6 border-t border-border text-center text-xs text-text-muted">
        <p>Campus Lost & Found — Built for fast recovery with explainable matching.</p>
      </footer>
    </div>
  );
}
