import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CAMPUS_ZONES } from '../constants/campus.ts';
import { storage } from '../services/storage.ts';

interface SafeHandoverModalProps {
  claimId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export const SafeHandoverModal: React.FC<SafeHandoverModalProps> = ({
  claimId,
  isOpen,
  onClose,
  onScheduled
}) => {
  // Aggregate verified safe handover locations
  const allSpots: { name: string; zone: string }[] = [];
  CAMPUS_ZONES.forEach((z) => {
    z.safe_handover_spots.forEach((spot) => {
      allSpots.push({ name: spot, zone: z.name });
    });
  });

  const [selectedSpot, setSelectedSpot] = useState(
    allSpots[0] ? `${allSpots[0].name} — ${allSpots[0].zone}` : 'Main Circulation Desk — University Library'
  );

  // Default to tomorrow 11:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const [dateStr, setDateStr] = useState(tomorrow.toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !claimId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSpot) {
      setErrorMsg('Please select a verified campus safe handover spot.');
      return;
    }

    try {
      storage.scheduleHandover(claimId, selectedSpot, new Date(dateStr).toISOString(), notes.trim());
      onScheduled();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Designate Safe Campus Pickup
              </h2>
              <p className="text-xs text-stone-500">
                Staffed, high-visibility campus locations with surveillance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Tip Banner */}
        <div className="px-6 py-3 bg-teal-50/80 border-b border-teal-200/80 text-xs text-teal-900 leading-relaxed">
          <strong>Campus Safety Recommendation:</strong> Always exchange items in designated public university locations (library circulation desk, student union, or police dispatch window) during staffed hours.
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Verified Campus Safe Meeting Spot *
            </label>
            <select
              value={selectedSpot}
              onChange={(e) => setSelectedSpot(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-stone-800"
            >
              {allSpots.map((spot, i) => {
                const label = `${spot.name} — ${spot.zone}`;
                return (
                  <option key={i} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Agreed Date & Time *
            </label>
            <input
              type="datetime-local"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Coordination Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. I will be wearing a green backpack by the check-in desk monitor..."
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Meeting Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
