import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('[NotificationContext] Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount or when user changes
  useEffect(() => {
    fetchNotifications();

    // Auto-refresh notifications every 20 seconds
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  const userMatches = notifications.filter((n) => n.type === 'match');
  const latestBroadcast = notifications.find((n) => n.type === 'broadcast');

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        userMatches,
        latestBroadcast,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
