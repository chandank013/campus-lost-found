import axios from 'axios';

const API_BASE = '/api';

// Interceptor to ensure Authorization header is always attached if token exists in localStorage
axios.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('campus_lost_found_token');
      if (token && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Auth methods
  register: async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/register`, { email, password });
    return res.data;
  },

  login: async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return res.data;
  },

  getMe: async () => {
    const res = await axios.get(`${API_BASE}/auth/me`);
    return res.data;
  },

  // Fetch filtered items (public feed)
  getItems: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/items`, { params });
    return res.data;
  },

  // Fetch items owned by the authenticated user
  getMyItems: async () => {
    const res = await axios.get(`${API_BASE}/items/mine`);
    return res.data;
  },

  // Fetch single item
  getItemById: async (id) => {
    const res = await axios.get(`${API_BASE}/items/${id}`);
    return res.data;
  },

  // Create new lost/found item with photo (authenticated)
  createItem: async (formData) => {
    const res = await axios.post(`${API_BASE}/items`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Fetch top 3 explainable matches
  getMatches: async (id) => {
    const res = await axios.get(`${API_BASE}/items/${id}/matches`);
    return res.data;
  },

  // Reveal contact information (authenticated, with optional verification answer for challenged items)
  revealContact: async (id, answer = null) => {
    const payload = answer !== null ? { answer } : {};
    const res = await axios.post(`${API_BASE}/items/${id}/reveal-contact`, payload);
    return res.data;
  },

  // Mark item as returned (authenticated, owner only)
  markReturned: async (id) => {
    const res = await axios.patch(`${API_BASE}/items/${id}/return`);
    return res.data;
  },

  // AI tag detection proxy
  detectTags: async (formData) => {
    const res = await axios.post(`${API_BASE}/detect`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Notification methods
  getNotifications: async () => {
    const res = await axios.get(`${API_BASE}/notifications`);
    return res.data;
  },

  markNotificationRead: async (id) => {
    const res = await axios.patch(`${API_BASE}/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await axios.post(`${API_BASE}/notifications/read-all`);
    return res.data;
  }
};
