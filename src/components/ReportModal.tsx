import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import {
  ItemCategory,
  ReportItem,
  ReportType,
  UserProfile,
  VerificationQuestion
} from '../types.ts';
import { CAMPUS_ZONES, COMMON_COLORS, ITEM_CATEGORIES } from '../constants/campus.ts';
import { storage } from '../services/storage.ts';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialType?: ReportType;
  editingReport?: ReportItem | null;
  onSave: (report: ReportItem) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialType = 'lost',
  editingReport,
  onSave
}) => {
  const [type, setType] = useState<ReportType>(initialType);
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState(COMMON_COLORS[0]);
  const [secondaryColor, setSecondaryColor] = useState('');
  const [brand, setBrand] = useState('');
  const [locationZone, setLocationZone] = useState(CAMPUS_ZONES[0].name);
  const [locationDetail, setLocationDetail] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');

  // Privacy Guard: Verification challenge questions for found items
  const [questions, setQuestions] = useState<{ question: string; hint: string; expected_answer: string }[]>([
    {
      question: 'What is a distinctive sticker, scratch, or engraved mark on this item?',
      hint: 'Be specific without giving the answer away',
      expected_answer: ''
    }
  ]);

  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (editingReport) {
      setType(editingReport.type);
      setCategory(editingReport.category);
      setTitle(editingReport.title);
      setDescription(editingReport.description);
      setPrimaryColor(editingReport.primary_color);
      setSecondaryColor(editingReport.secondary_color || '');
      setBrand(editingReport.brand || '');
      setLocationZone(editingReport.location_zone);
      setLocationDetail(editingReport.location_detail);
      setDateOccurred(editingReport.date_occurred);
      setImageUrl(editingReport.image_url || '');
      if (editingReport.verification_questions && editingReport.verification_questions.length > 0) {
        setQuestions(
          editingReport.verification_questions.map((q) => ({
            question: q.question,
            hint: q.hint || '',
            expected_answer: q.expected_answer || ''
          }))
        );
      }
    } else {
      setType(initialType);
      setTitle('');
      setDescription('');
      setCategory('Electronics');
      setPrimaryColor(COMMON_COLORS[0]);
      setSecondaryColor('');
      setBrand('');
      setLocationZone(CAMPUS_ZONES[0].name);
      setLocationDetail('');
      setDateOccurred(new Date().toISOString().split('T')[0]);
      setImageUrl('');
      setQuestions([
        {
          question: 'What is a distinctive sticker, scratch, or engraved mark on this item?',
          hint: 'Be specific without giving the answer away',
          expected_answer: ''
        }
      ]);
    }
    setErrorMsg('');
    setDuplicateWarning(null);
  }, [editingReport, initialType, isOpen]);

  // Live duplicate warning check
  useEffect(() => {
    if (!title || title.length < 4 || editingReport) {
      setDuplicateWarning(null);
      return;
    }
    const all = storage.getReports();
    const potential = all.find(
      (r) =>
        r.type === type &&
        r.category === category &&
        r.location_zone === locationZone &&
        r.title.toLowerCase().includes(title.toLowerCase().trim().slice(0, 10))
    );
    if (potential) {
      setDuplicateWarning(
        `Similar active ${type} report found: "${potential.title}" in ${potential.location_zone}. Please ensure you are not creating a duplicate.`
      );
    } else {
      setDuplicateWarning(null);
    }
  }, [title, type, category, locationZone, editingReport]);

  if (!isOpen) return null;

  // Image Upload handler with client-side file type and size validation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setImageError('Image file size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddQuestion = () => {
    if (questions.length >= 3) return;
    setQuestions([
      ...questions,
      { question: '', hint: '', expected_answer: '' }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a clear item title.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Please provide a descriptive summary (at least 10 characters).');
      return;
    }
    if (!locationDetail.trim()) {
      setErrorMsg('Please specify the approximate room, bench, or study area.');
      return;
    }

    // If found item, validate that at least 1 question and answer is entered
    if (type === 'found') {
      const validQs = questions.filter((q) => q.question.trim() && q.expected_answer.trim());
      if (validQs.length === 0) {
        setErrorMsg('Please configure at least one verification question and secret answer for this found item.');
        return;
      }
    }

    const formattedQuestions: VerificationQuestion[] =
      type === 'found'
        ? questions
            .filter((q) => q.question.trim() && q.expected_answer.trim())
            .map((q, i) => ({
              id: `q-${Date.now()}-${i}`,
              report_id: editingReport ? editingReport.id : '',
              question: q.question.trim(),
              hint: q.hint.trim() || undefined,
              expected_answer: q.expected_answer.trim()
            }))
        : [];

    try {
      if (editingReport) {
        const updated = storage.updateReport(editingReport.id, {
          type,
          category,
          title: title.trim(),
          description: description.trim(),
          primary_color: primaryColor,
          secondary_color: secondaryColor.trim() || undefined,
          brand: brand.trim() || undefined,
          location_zone: locationZone,
          location_detail: locationDetail.trim(),
          date_occurred: dateOccurred,
          image_url: imageUrl || undefined,
          verification_questions: formattedQuestions.length > 0 ? formattedQuestions : undefined
        });
        if (updated) {
          onSave(updated);
          onClose();
        }
      } else {
        const created = storage.createReport({
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          user_email: currentUser.email,
          type,
          category,
          title: title.trim(),
          description: description.trim(),
          primary_color: primaryColor,
          secondary_color: secondaryColor.trim() || undefined,
          brand: brand.trim() || undefined,
          location_zone: locationZone,
          location_detail: locationDetail.trim(),
          date_occurred: dateOccurred,
          image_url: imageUrl || undefined,
          verification_questions: formattedQuestions
        });
        onSave(created);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              {editingReport ? 'Edit Campus Report' : 'File a Campus Report'}
            </h2>
            <p className="text-xs text-stone-500">
              Submit accurate details to discover automated matches across campus.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Type Selector (Segmented buttons) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Report Nature
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  type === 'lost'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                I Lost an Item
              </button>
              <button
                type="button"
                onClick={() => setType('found')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  type === 'found'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                I Found an Item
              </button>
            </div>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 14-inch MacBook Pro in dark wool sleeve"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description & Identifying Characteristics *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe stickers, scratches, case material, accessories, or where you remember leaving it..."
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 leading-relaxed"
              required
            />
          </div>

          {/* Brand, Primary Color, Secondary Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Hydro Flask, Sony"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Color *
              </label>
              <select
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {COMMON_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Secondary Color (Optional)
              </label>
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="e.g. Charcoal, Gold"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Campus Location & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Campus Zone / Building *
              </label>
              <select
                value={locationZone}
                onChange={(e) => setLocationZone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {CAMPUS_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.name}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Specific Spot / Room *
              </label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="e.g. 3rd Floor Stacks, Desk #14"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Approximate Date *
              </label>
              <input
                type="date"
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
          </div>

          {/* Secure Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Photo Upload (JPG, PNG, WEBP &lt; 5MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-stone-500" />
                <span>Choose Image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {imageUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-md border border-stone-200"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {imageError && <p className="text-[11px] text-red-600 mt-1">{imageError}</p>}
          </div>

          {/* Privacy Guard: 2-Step Challenge Questions (Strictly for Found Items) */}
          {type === 'found' && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <span>Ownership Challenge Questions (Privacy Guard)</span>
                  </h4>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    Ask questions that only the true owner would know. The expected answer is stored securely and never shown to claimants.
                  </p>
                </div>
                {questions.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-white px-2 py-1 rounded-md border border-teal-200"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Question</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-teal-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-700">
                        Question #{idx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].question = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="e.g. What sticker is placed on the lower right lid?"
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={q.hint}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].hint = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Hint for claimant (optional, e.g. club badge)"
                        className="w-full px-2.5 py-1.5 text-[11px] border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                      />
                      <input
                        type="text"
                        value={q.expected_answer}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].expected_answer = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Secret expected answer (hidden from claimant) *"
                        className="w-full px-2.5 py-1.5 text-[11px] border border-teal-300 rounded-md bg-teal-50/30 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium text-stone-800"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors"
            >
              {editingReport ? 'Save Changes' : 'Publish Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
