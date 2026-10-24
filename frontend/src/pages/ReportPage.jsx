import React, { useState } from 'react';
import { ArrowLeft, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = ['bag', 'phone', 'bottle', 'umbrella', 'laptop', 'book', 'other'];
const COLORS = ['black', 'white', 'grey', 'red', 'blue', 'green', 'yellow', 'brown', 'other'];

export default function ReportPage({ initialType = 'lost', onBack, onSuccess }) {
  const [type, setType] = useState(initialType);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [category, setCategory] = useState('other');
  const [color, setColor] = useState('other');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [contact, setContact] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');

  // Auto-tag state (Slice 4 hook ready)
  const [detecting, setDetecting] = useState(false);
  const [autoTagNote, setAutoTagNote] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (<= 5 MB)
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select a valid image file (JPG, PNG, WebP).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image size exceeds 5 MB. Please choose a smaller photo.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, photo: null }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Slice 4: Optional detector call
    try {
      setDetecting(true);
      const formData = new FormData();
      formData.append('image', file);
      const suggestions = await api.detectTags(formData);
      if (suggestions && suggestions.category && !suggestions.fallback && suggestions.category !== 'other') {
        setCategory(suggestions.category);
        if (suggestions.color) setColor(suggestions.color);
        setAutoTagNote('Suggested automatically. Please check.');
      } else {
        setAutoTagNote('');
      }
    } catch {
      // Graceful fallback: manual selection
      setAutoTagNote('');
    } finally {
      setDetecting(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!photoFile) errs.photo = 'A photo is required for item verification.';
    if (!category) errs.category = 'Category is required.';
    if (!color) errs.color = 'Color is required.';
    if (!location.trim()) errs.location = 'Campus location is required.';
    if (!date) errs.date = 'Date is required.';
    if (!contact.trim()) errs.contact = 'Contact email or phone is required.';
    if (type === 'found' && !currentLocation.trim()) {
      errs.currentLocation = 'Please specify where the item is currently held (e.g. Desk or With me).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('category', category);
      formData.append('color', color);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('date', date);
      formData.append('contact', contact);
      if (type === 'found') {
        formData.append('currentLocation', currentLocation);
      }
      formData.append('image', photoFile);

      const created = await api.createItem(formData);
      onSuccess(created._id);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: err.response?.data?.error || err.message || 'Failed to submit report. Please try again.'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const isLost = type === 'lost';

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Back Link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-main mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to feed</span>
      </button>

      {/* Card Form */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header & Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-text-main">
              Report {isLost ? 'Lost' : 'Found'} Item
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Fill in the details below to publish to the campus board and find matches.
            </p>
          </div>

          {/* Type Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                isLost ? 'bg-lost-bg text-lost-text shadow-xs' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => setType('found')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                !isLost ? 'bg-found-bg text-found-text shadow-xs' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Found
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errors.form && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 1. Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-2">
              Photo <span className="text-red-500">*</span>
            </label>
            
            {photoPreview ? (
              <div className="relative aspect-[4/3] max-w-sm rounded-xl overflow-hidden border border-border bg-slate-50 mb-2">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setAutoTagNote('');
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-xs font-semibold hover:bg-slate-900"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-all">
                <Upload size={32} className="text-text-muted mb-2" />
                <span className="text-sm font-semibold text-text-main">Click to upload photo</span>
                <span className="text-xs text-text-muted mt-1">PNG, JPG, WebP up to 5MB</span>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                />
              </label>
            )}

            {detecting && (
              <div className="flex items-center gap-2 text-xs text-primary font-medium mt-2">
                <Loader2 size={14} className="animate-spin" />
                <span>AI analyzing photo tags...</span>
              </div>
            )}

            {autoTagNote && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg mt-2">
                <Sparkles size={14} />
                <span>{autoTagNote}</span>
              </div>
            )}

            {errors.photo && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.photo}</p>}
          </div>

          {/* 2. Category & Color Dropdowns (Manual-first, always editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary capitalize"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1 font-medium">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                Primary Color <span className="text-red-500">*</span>
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary capitalize"
              >
                {COLORS.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              {errors.color && <p className="text-xs text-red-600 mt-1 font-medium">{errors.color}</p>}
            </div>
          </div>

          {/* 3. Description with Hint */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Blue waterproof backpack with black zip, sticker on front, and padded straps"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              💡 Hint: Add details that aren't obvious from the photo, such as a sticker, a scratch, or what's inside.
            </p>
          </div>

          {/* 4. Location & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                Campus Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Library 2nd floor desk"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.location && <p className="text-xs text-red-600 mt-1 font-medium">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.date && <p className="text-xs text-red-600 mt-1 font-medium">{errors.date}</p>}
            </div>
          </div>

          {/* 5. Contact (Required) with Privacy Notice */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Contact Email or Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. student@campus.edu or 555-0199"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-slate-500 mt-1">
              🔒 Contact info is hidden from the feed and shown only when someone clicks Contact the poster.
            </p>
            {errors.contact && <p className="text-xs text-red-600 mt-1 font-medium">{errors.contact}</p>}
          </div>

          {/* 6. Current Custody (Found Items Only) */}
          {!isLost && (
            <div>
              <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                Where is the item now? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. Left at Library 2nd floor desk, or With me"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.currentLocation && <p className="text-xs text-red-600 mt-1 font-medium">{errors.currentLocation}</p>}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-all shadow-sm disabled:opacity-50 active:scale-95"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>{submitting ? 'Submitting...' : `Post ${isLost ? 'Lost' : 'Found'} Item`}</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
