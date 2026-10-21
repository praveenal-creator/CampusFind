import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  MessageSquare
} from 'lucide-react';
import { Claim, ReportItem, UserProfile } from '../types.ts';
import { storage } from '../services/storage.ts';

interface ClaimReviewModalProps {
  claim: Claim | null;
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onReviewed: (updatedClaim: Claim) => void;
  onOpenChat: (claimId: string) => void;
}

export const ClaimReviewModal: React.FC<ClaimReviewModalProps> = ({
  claim,
  report,
  isOpen,
  onClose,
  currentUser,
  onReviewed,
  onOpenChat
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !claim || !report) return null;

  const isFinder = report.user_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';

  if (!isFinder && !isAdmin) {
    return null;
  }

  const handleApprove = () => {
    try {
      const updated = storage.updateClaimStatus(claim.id, 'approved');
      onReviewed(updated);
      onClose();
      onOpenChat(claim.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setErrorMsg('Please state a reason for rejecting this claim (e.g. Inaccurate sticker description).');
      return;
    }
    try {
      const updated = storage.updateClaimStatus(claim.id, 'rejected', rejectionReason.trim());
      onReviewed(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  // Find expected answers
  const questionsMap = new Map<string, string>();
  if (report.verification_questions) {
    report.verification_questions.forEach((q) => {
      if (q.expected_answer) {
        questionsMap.set(q.id, q.expected_answer);
      }
    });
  }

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
                Review Ownership Claim
              </h2>
              <p className="text-xs text-stone-500">
                Evaluate answers against private item characteristics
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

        {/* Claimant Strip */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-stone-400" />
            <span className="font-semibold text-stone-800">{claim.claimant_name}</span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-500">{claim.claimant_email}</span>
          </div>
          <span className="font-mono text-[11px] text-stone-500">
            Attempt #{claim.attempt_count}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {claim.answers.map((ans, idx) => {
              const expected = questionsMap.get(ans.question_id);
              return (
                <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div className="font-bold text-stone-800">
                    Question {idx + 1}: {ans.question_text}
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-0.5">
                      Claimant Submitted Answer:
                    </span>
                    <p className="text-stone-900 font-medium">{ans.submitted_answer}</p>
                  </div>

                  {expected && (
                    <div className="bg-teal-50/70 p-2.5 rounded-lg border border-teal-200 text-teal-950">
                      <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider block mb-0.5">
                        Your Secret Expected Answer:
                      </span>
                      <p className="font-medium font-mono text-[11px]">{expected}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rejection reason box */}
          {showRejectInput && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
              <label className="block text-xs font-semibold text-red-900">
                Reason for Rejection:
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State why this claim was not approved (e.g. Inaccurate brand or color)..."
                className="w-full px-2.5 py-1.5 text-xs border border-red-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1 text-xs text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div>
            {!showRejectInput && (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Claim</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Unlock Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
