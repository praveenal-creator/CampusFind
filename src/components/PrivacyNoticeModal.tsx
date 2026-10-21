import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { storage } from '../services/storage.ts';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onDataDeleted: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDataDeleted
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleDelete = () => {
    const res = storage.deleteUserData(currentUser.id);
    if (res.success) {
      setSuccessMsg(
        `Your user records (${res.deletedReports} reports, ${res.deletedClaims} claims) have been permanently erased under FERPA/GDPR compliance.`
      );
      setConfirmDelete(false);
      onDataDeleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Campus Privacy & Data Rights
              </h2>
              <p className="text-xs text-stone-500">
                FERPA compliance, anti-harassment, and data governance
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

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-800 mb-1">
                1. No Public Contact Information
              </h4>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                CampusFind never prints student mobile numbers or personal email addresses on public item postings. All initial coordination occurs via in-app message threads with Row Level Security.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-800 mb-1">
                2. Challenge Question Isolation
              </h4>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                Found item challenge answers are stored in isolated database columns protected by Supabase RLS policies. Claimants cannot view expected answers in API payloads.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-800 mb-1">
                3. Physical Campus Safe Handover
              </h4>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                We strongly advise all students to meet exclusively at designated staffed public university stations (e.g. Library Front Circulation, Student Union Desk, Police Station).
              </p>
            </div>
          </div>

          {/* Account Data Erasure Section */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div>
              <h4 className="font-bold text-red-900 text-xs">
                FERPA / GDPR Right to Erasure
              </h4>
              <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed">
                You may request immediate and permanent deletion of all reports, claims, and private messages filed under your student identity (<strong>{currentUser.full_name}</strong>).
              </p>
            </div>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete My Campus Records</span>
              </button>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-red-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>Confirm Irreversible Record Erasure?</span>
                </div>
                <p className="text-[11px] text-red-800">
                  This action will permanently delete all open lost/found reports and active claims authored by {currentUser.email}.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    Confirm Permanent Erasure
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
