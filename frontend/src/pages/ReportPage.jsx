import React, { useState } from 'react';
import { 
  ChevronLeft, Camera, X, Check, Loader2, MapPin, Calendar, 
  Phone, AlertCircle, ShoppingBag, Droplet
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'bag', label: 'Bag / Backpack' },
  { id: 'bottle', label: 'Bottle' },
  { id: 'phone', label: 'Phone' },
  { id: 'umbrella', label: 'Umbrella' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'book', label: 'Book' },
  { id: 'other', label: 'Other Item' },
];

const COLORS = [
  { id: 'black', label: 'Black', hex: '#0f172a' },
  { id: 'white', label: 'White', hex: '#f8fafc', border: true },
  { id: 'grey', label: 'Grey', hex: '#94a3b8' },
  { id: 'red', label: 'Red', hex: '#ef4444' },
  { id: 'blue', label: 'Blue', hex: '#2563eb' },
  { id: 'green', label: 'Green', hex: '#059669' },
  { id: 'yellow', label: 'Yellow', hex: '#eab308' },
  { id: 'brown', label: 'Brown', hex: '#78350f' },
  { id: 'other', label: 'Other / Mixed', hex: '#cbd5e1' },
];

const CUSTODY_OPTIONS = [
  'With me (I can return it)',
  'Submitted to the campus lost-and-found office',
  'Left where found (e.g. Library front desk)',
  'Other'
];

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
  const [currentLocation, setCurrentLocation] = useState(CUSTODY_OPTIONS[0]);

  // AI Auto-Tag State
  const [detecting, setDetecting] = useState(false);
  const [autoTagNote, setAutoTagNote] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isLost = type === 'lost';

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select a valid image (PNG, JPG, WebP).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image size exceeds 5 MB. Please choose a smaller photo.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, photo: null }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Express proxy call to Flask YOLO + OpenCV
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
      setAutoTagNote('');
    } finally {
      setDetecting(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setAutoTagNote('');
  };

  const validate = () => {
    const errs = {};
    if (!photoFile) errs.photo = 'A photo is required for item verification.';
    if (!category) errs.category = 'Category is required.';
    if (!color) errs.color = 'Color is required.';
    if (!location.trim()) errs.location = 'Campus location is required.';
    if (!date) errs.date = 'Date is required.';
    if (!contact.trim()) errs.contact = 'Contact email or phone number is required.';
    if (!isLost && !currentLocation) {
      errs.currentLocation = 'Please select where the item is currently kept.';
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
      if (!isLost) {
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

  const selectedColorHex = COLORS.find((c) => c.id === color)?.hex || '#cbd5e1';

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Header Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80">
        
        {/* Navigation & Titles */}
        <div className="relative flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
            title="Back to feed"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="text-center flex-1 px-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Report {isLost ? 'Lost Item' : 'Found Item'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isLost ? 'Help the campus community return your belongings' : 'Help return lost items to their owners'}
            </p>
          </div>

          {/* Type Toggle Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => { setType('lost'); setAutoTagNote(''); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                isLost ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => { setType('found'); setAutoTagNote(''); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                !isLost ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Found
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errors.form && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="font-medium">{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* 1. Photo Upload (Matching Image 2 Reference) */}
          <div>
            {photoPreview ? (
              <div className="flex flex-wrap items-center gap-4">
                {/* Selected Preview Box */}
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-100">
                  <img src={photoPreview} alt="Item preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 transition-colors shadow-sm"
                    title="Remove photo"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Change / Add More Card */}
                <label className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary-brand bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center p-3 cursor-pointer text-center transition-all group">
                  <div className="w-10 h-10 rounded-full bg-primary-light text-primary-brand flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Camera size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Change photo</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Tap to replace</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-primary-brand rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition-all text-center group">
                <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary-brand flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <Camera size={24} />
                </div>
                <span className="text-sm font-bold text-slate-900">Add photos</span>
                <span className="text-xs text-slate-500 mt-1">Tap to upload item photo (PNG, JPG, WebP up to 5MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}

            {errors.photo && <p className="text-xs text-red-600 font-semibold mt-2">{errors.photo}</p>}
          </div>

          {/* 2. Category & Color Dropdowns (Two Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <ShoppingBag size={18} />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all appearance-none cursor-pointer hover:border-slate-300 capitalize"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category && <p className="text-xs text-red-600 font-semibold mt-1">{errors.category}</p>}
            </div>

            {/* Color Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Color <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span 
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs" 
                    style={{ backgroundColor: selectedColorHex }}
                  />
                </div>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all appearance-none cursor-pointer hover:border-slate-300 capitalize"
                >
                  {COLORS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.color && <p className="text-xs text-red-600 font-semibold mt-1">{errors.color}</p>}
            </div>

          </div>

          {/* AI Auto-Tag Feedback Banner */}
          {detecting && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-primary-brand">
              <Loader2 size={16} className="animate-spin" />
              <span>AI analyzing photo tags...</span>
            </div>
          )}

          {autoTagNote && !detecting && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800 animate-fadeIn">
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                ✓
              </div>
              <span>{autoTagNote}</span>
            </div>
          )}

          {/* 3. Description (With character counter) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {description.length}/300
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Found a blue backpack near the library. It looks in good condition and has multiple compartments."
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all resize-none"
            />
          </div>

          {/* 4. Location */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                <MapPin size={18} />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Library 2nd floor desk"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all"
              />
            </div>
            {errors.location && <p className="text-xs text-red-600 font-semibold mt-1">{errors.location}</p>}
          </div>

          {/* 5. Date & Contact (Two Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {isLost ? 'Date Lost' : 'Date Found'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all cursor-pointer"
                />
              </div>
              {errors.date && <p className="text-xs text-red-600 font-semibold mt-1">{errors.date}</p>}
            </div>

            {/* Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Your Contact <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or student@campus.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all"
                />
              </div>
              {errors.contact && <p className="text-xs text-red-600 font-semibold mt-1">{errors.contact}</p>}
            </div>

          </div>

          {/* Contact Privacy Assurance */}
          <p className="text-[11px] text-slate-500 font-medium">
            🔒 Contact information is protected and shown only when someone clicks "Contact the poster".
          </p>

          {/* 6. Current Item Location (Where is the item now?) - Found Items Only */}
          {!isLost && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Where is the item now? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <MapPin size={18} />
                </div>
                <select
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all appearance-none cursor-pointer hover:border-slate-300"
                >
                  {CUSTODY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Let us know where the item is currently kept.
              </p>
              {errors.currentLocation && <p className="text-xs text-red-600 font-semibold mt-1">{errors.currentLocation}</p>}
            </div>
          )}

          {/* 7. Full-Width Deep Indigo Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-base shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              <span>{submitting ? 'Submitting report...' : 'Submit'}</span>
            </button>
          </div>

        </form>

      </div>
    </main>
  );
}
