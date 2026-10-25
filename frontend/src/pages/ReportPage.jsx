import React, { useState } from 'react';
import { 
  ChevronLeft, Camera, X, Check, Loader2, MapPin, Calendar, 
  Phone, AlertCircle, ShoppingBag, Droplet, Lock, LogIn
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export default function ReportPage({ initialType = 'lost', onBack, onSuccess, onNavigate }) {
  const { user } = useAuth();
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

  // Private verification challenge (found items)
  const [privateQuestion, setPrivateQuestion] = useState('');
  const [privateAnswer, setPrivateAnswer] = useState('');

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
    if (!isLost && privateQuestion.trim() && !privateAnswer.trim()) {
      errs.privateAnswer = 'Please provide the expected answer for your verification question.';
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
        if (privateQuestion.trim() && privateAnswer.trim()) {
          formData.append('privateQuestion', privateQuestion.trim());
          formData.append('privateAnswer', privateAnswer.trim());
        }
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

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-primary-brand/10 text-primary-brand flex items-center justify-center mx-auto mb-4">
            <LogIn size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Login Required</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Please log in or create an account to report lost or found items and manage returns.
          </p>
          <button
            onClick={() => onNavigate('login', { redirect: `#/report?type=${type}` })}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-xs hover:bg-primary-hover transition-colors"
          >
            Log In / Register
          </button>
          <button
            onClick={onBack}
            className="w-full mt-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Back to feed
          </button>
        </div>
      </main>
    );
  }

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

        {/* Global Error Notice */}
        {errors.form && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Mandatory Photo Upload with Drag/Click Container */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Photo Upload <span className="text-red-500">*</span>
            </label>

            {!photoPreview ? (
              <label className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                errors.photo ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
              }`}>
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-primary-brand mb-3">
                  <Camera size={28} />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to upload item photo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  JPG, PNG, or WebP up to 5 MB
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 max-h-72 flex items-center justify-center group">
                <img 
                  src={photoPreview} 
                  alt="Preview of reported item" 
                  className="max-h-72 w-full object-contain"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/70 text-white hover:bg-slate-900 transition-colors shadow-md backdrop-blur-xs"
                  title="Remove image"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {errors.photo && (
              <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle size={14} />
                <span>{errors.photo}</span>
              </p>
            )}
          </div>

          {/* 2. Manual-First Category & Color Row */}
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
                  onChange={(e) => { setCategory(e.target.value); setAutoTagNote(''); }}
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
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs inline-block"
                    style={{ backgroundColor: selectedColorHex }}
                  />
                </div>
                <select
                  value={color}
                  onChange={(e) => { setColor(e.target.value); setAutoTagNote(''); }}
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

          {/* 7. Optional Private Ownership Verification Challenge - Found Items Only */}
          {!isLost && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock size={16} className="text-primary-brand" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Private Verification Challenge (Optional)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Add an ownership question that only the true owner can answer. Claimants will be required to answer this correctly before contact details are revealed.
              </p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verification Question
                  </label>
                  <input
                    type="text"
                    value={privateQuestion}
                    onChange={(e) => setPrivateQuestion(e.target.value)}
                    placeholder="e.g. What keychain is attached, or what sticker is on the back?"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Answer
                  </label>
                  <input
                    type="text"
                    value={privateAnswer}
                    onChange={(e) => setPrivateAnswer(e.target.value)}
                    placeholder="e.g. NASA astronaut"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all"
                  />
                  {errors.privateAnswer && (
                    <p className="text-xs text-red-600 font-semibold mt-1">{errors.privateAnswer}</p>
                  )}
                  <span className="block text-[11px] text-slate-400 mt-1 font-medium">
                    🔒 Stored hashed (case-insensitive &amp; trimmed). Never displayed publicly. Max 3 attempts allowed before temporary lockout.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 8. Full-Width Deep Indigo Submit Button */}
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
