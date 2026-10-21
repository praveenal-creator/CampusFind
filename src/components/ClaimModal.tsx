import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Claim, ReportItem, UserProfile } from '../types.ts';
import { storage } from '../services/storage.ts';

interface ClaimModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: (claim: Claim) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  report,
  isOpen,
  onClose,
  currentUser,
  onSuccess
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !report) return null;

  const existingClaims = storage.getClaimsForReport(report.id);
  const userClaim = existingClaims.find((c) => c.claimant_id === currentUser.id);
  const attemptsMade = userClaim ? userClaim.attempt_count : 0;
  const maxAttempts = 3;

  const questions = report.verification_questions || [
    {
      id: 'default-q',
      report_id: report.id,
      question: 'Please describe unique physical characteristics, engravings, or contents of this item in detail.',
      hint: 'Include any personal stickers, scratches, or interior cards'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validate that all questions have non-empty answers
    const payload = questions.map((q) => {
      const val = answers[q.id]?.trim() || '';
      return {
        question_id: q.id,
        question_text: q.question,
        submitted_answer: val
      };
    });

    const empty = payload.find((p) => !p.submitted_answer);
    if (empty) {
      setErrorMsg('Please answer all ownership verification questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newClaim = storage.submitClaim(report.id, payload);
      onSuccess(newClaim);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Submit Ownership Claim
              </h2>
              <p className="text-xs text-stone-500">
                Answer finder challenge questions to verify ownership
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

        {/* Item Preview Strip */}
        <div className="px-6 py-3 bg-stone-100/70 border-b border-stone-200 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0">
            {report.image_url ? (
              <img
                src={report.image_url}
                alt={report.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                Item
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-stone-900 truncate">{report.title}</h4>
            <p className="text-[11px] text-stone-500 truncate">
              Found at {report.location_zone} · {report.primary_color}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Attempts counter & security warning */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                Attempt {attemptsMade + 1} of {maxAttempts}
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                CampusFind uses private challenge verification. Your answers are sent directly to the finder and campus security for evaluation. False claims violate the University Honor Code.
              </p>
            </div>
          </div>

          {/* Question fields */}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {idx + 1}. {q.question} *
                </label>
                {q.hint && (
                  <p className="text-[11px] text-stone-500 italic">
                    Hint: {q.hint}
                  </p>
                )}
                <textarea
                  rows={2}
                  value={answers[q.id] || ''}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [q.id]: e.target.value
                    })
                  }
                  placeholder="Provide precise details..."
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 leading-relaxed"
                  required
                />
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2 text-[11px] text-stone-500">
            <Lock className="w-4 h-4 text-stone-400 shrink-0" />
            <span>
              Your identity (<strong>{currentUser.full_name}</strong>, {currentUser.email}) is authenticated.
            </span>
          </div>

          {/* Actions */}
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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
