import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Fetch filtered items
  getItems: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/items`, { params });
    return res.data;
  },

  // Fetch single item
  getItemById: async (id) => {
    const res = await axios.get(`${API_BASE}/items/${id}`);
    return res.data;
  },

  // Create new lost/found item with photo
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

  // Reveal contact information
  revealContact: async (id) => {
    const res = await axios.post(`${API_BASE}/items/${id}/reveal-contact`);
    return res.data;
  },

  // Mark item as returned
  markReturned: async (id) => {
    const res = await axios.patch(`${API_BASE}/items/${id}/return`);
    return res.data;
  },

  // AI tag detection proxy (Slice 4)
  detectTags: async (formData) => {
    const res = await axios.post(`${API_BASE}/detect`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
