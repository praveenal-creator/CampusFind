import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  Edit2,
  Trash2,
  MessageSquare,
  ArrowRight,
  User,
  ShieldAlert
} from 'lucide-react';
import { Claim, ReportItem, UserProfile } from '../types.ts';
import { computeReportMatch, findTopMatches } from '../services/matchEngine.ts';
import { storage } from '../services/storage.ts';

interface ItemDetailModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allReports: ReportItem[];
  onOpenClaimModal: (report: ReportItem) => void;
  onOpenReviewModal: (claim: Claim) => void;
  onOpenChat: (claimId: string) => void;
  onEditReport: (report: ReportItem) => void;
  onDeleteReport: (reportId: string) => void;
  onSelectCandidate: (candidate: ReportItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  currentUser,
  allReports,
  onOpenClaimModal,
  onOpenReviewModal,
  onOpenChat,
  onEditReport,
  onDeleteReport,
  onSelectCandidate
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'matches' | 'claims'>('details');

  if (!isOpen || !report) return null;

  const isOwner = report.user_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  const isFound = report.type === 'found';
  const isReturned = report.status === 'returned';

  // Compute matches
  const topMatches = findTopMatches(report, allReports);

  // Get claims for this report
  const itemClaims = storage.getClaimsForReport(report.id);
  const userClaim = itemClaims.find((c) => c.claimant_id === currentUser.id);
  const approvedClaim = itemClaims.find((c) => c.status === 'approved' || c.status === 'returned');

  const formattedDate = new Date(report.date_occurred).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleMarkReturned = () => {
    storage.updateReport(report.id, { status: 'returned' });
    if (approvedClaim) {
      storage.updateClaimStatus(approvedClaim.id, 'returned');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-stone-200 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-md ${
                isFound
                  ? 'bg-teal-900 text-teal-100'
                  : 'bg-amber-900 text-amber-100'
              }`}
            >
              {report.type}
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs font-medium text-stone-600">ID: {report.id}</span>
            {isReturned && (
              <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Returned & Closed
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Report Details
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Smart Matches ({topMatches.length})</span>
          </button>
          {(isOwner || isAdmin || userClaim) && (
            <button
              onClick={() => setActiveTab('claims')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'claims'
                  ? 'border-teal-700 text-teal-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>Ownership Claims ({itemClaims.length})</span>
            </button>
          )}
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Media & Key Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="relative aspect-4/3 rounded-xl bg-stone-100 overflow-hidden border border-stone-200">
                  {report.image_url ? (
                    <img
                      src={report.image_url}
                      alt={report.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                      <Package className="w-12 h-12 stroke-[1.5] mb-1" />
                      <span className="text-xs">{report.category}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    {/* Zero-Pill Unboxed Metadata */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1 flex-wrap">
                      <span className="font-semibold text-stone-800">{report.category}</span>
                      <span>·</span>
                      <span>{report.primary_color}</span>
                      {report.secondary_color && (
                        <>
                          <span>/</span>
                          <span>{report.secondary_color}</span>
                        </>
                      )}
                      {report.brand && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-stone-700">{report.brand}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-stone-900 leading-snug">
                      {report.title}
                    </h2>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-stone-800">{report.location_zone}</span>
                        <p className="text-stone-500 text-[11px] mt-0.5">{report.location_detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60">
                      <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="text-stone-700 font-medium">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60">
                      <User className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="text-stone-600">
                        Reported by <strong className="text-stone-800">{report.user_name}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Flag warning if flagged */}
                  {report.is_flagged && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Flagged for Moderation:</span>
                        <p className="text-[11px] mt-0.5">{report.flag_reason || 'Under administrative review'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Full Report Description
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/70 p-3.5 rounded-xl border border-stone-200">
                  {report.description}
                </p>
              </div>

              {/* Challenge Questions Preview (Found Items) */}
              {isFound && report.verification_questions && report.verification_questions.length > 0 && (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <h4 className="text-xs font-bold text-teal-950">
                        2-Step Ownership Verification Challenge
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      {report.verification_questions.length} Question{report.verification_questions.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="text-[11px] text-teal-900 leading-relaxed">
                    Claimants must accurately answer these questions to prove ownership before private messaging and safe handover can proceed.
                  </p>

                  <div className="space-y-2">
                    {report.verification_questions.map((q, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-teal-100 text-xs space-y-1">
                        <div className="font-semibold text-stone-800">
                          {idx + 1}. {q.question}
                        </div>
                        {q.hint && (
                          <div className="text-[11px] text-stone-500">
                            <em>Hint:</em> {q.hint}
                          </div>
                        )}
                        {/* Only show expected answer to owner or admin */}
                        {(isOwner || isAdmin) && q.expected_answer && (
                          <div className="mt-1 pt-1 border-t border-stone-100 text-[11px] text-teal-800 font-mono">
                            <strong>Expected secret answer:</strong> {q.expected_answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Explainable Smart Matching Radar</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Comparing open opposite reports using deterministic token similarity, category, brand, color, location, and date proximity.
                  </p>
                </div>
              </div>

              {topMatches.length === 0 ? (
                <div className="text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-200 p-6">
                  <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-stone-600">No strong matches detected yet</p>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-sm mx-auto">
                    When students report items with similar categories, brands, colors, or locations, they will appear here with explainable score breakdowns.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topMatches.map((match) => (
                    <div
                      key={match.candidate_report.id}
                      className="bg-white border border-stone-200 rounded-xl p-4 hover:border-teal-300 transition-colors shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                            {match.candidate_report.image_url ? (
                              <img
                                src={match.candidate_report.image_url}
                                alt={match.candidate_report.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold">
                                {match.candidate_report.category.slice(0, 3)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                  match.candidate_report.type === 'found'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {match.candidate_report.type}
                              </span>
                              <span className="text-xs text-stone-500">
                                {match.candidate_report.location_zone}
                              </span>
                            </div>
                            <h5 className="font-semibold text-stone-900 text-sm mt-0.5">
                              {match.candidate_report.title}
                            </h5>
                            <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                              {match.candidate_report.description}
                            </p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-baseline gap-0.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900">
                            <span className="text-base font-bold font-mono tabular-nums leading-none">
                              {match.total_score}
                            </span>
                            <span className="text-[10px] font-semibold">% Match</span>
                          </div>
                          <button
                            onClick={() => {
                              onSelectCandidate(match.candidate_report);
                            }}
                            className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1 ml-auto"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Factor Contribution Breakdown */}
                      <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        {match.factors.map((f, i) => (
                          <div key={i} className="p-1.5 bg-stone-50 rounded-md">
                            <div className="flex items-center justify-between text-stone-700 font-medium">
                              <span>{f.factor}</span>
                              <span className="font-mono text-teal-700">+{f.contribution}%</span>
                            </div>
                            <p className="text-[10px] text-stone-400 truncate mt-0.5" title={f.explanation}>
                              {f.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Ownership Claim Records
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Students submit answers to hidden questions. Finder or Admin reviews and approves.
                  </p>
                </div>
              </div>

              {itemClaims.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  <p className="text-xs text-stone-500">No ownership claims filed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">
                              Claimant: {claim.claimant_name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                claim.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : claim.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : claim.status === 'returned'
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {claim.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-mono">
                            Submitted: {new Date(claim.created_at).toLocaleString()} · Attempt #{claim.attempt_count}
                          </span>
                        </div>

                        {/* Actions for Review */}
                        <div className="flex items-center gap-2">
                          {(isOwner || isAdmin) && claim.status === 'under_review' && (
                            <button
                              onClick={() => onOpenReviewModal(claim)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
                            >
                              Review Answers
                            </button>
                          )}

                          {(claim.status === 'approved' || claim.status === 'returned') && (
                            <button
                              onClick={() => onOpenChat(claim.id)}
                              className="px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Private Chat</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Submitted answers preview */}
                      <div className="p-2.5 bg-stone-50 rounded-lg space-y-1.5 text-xs">
                        <span className="font-semibold text-stone-700 text-[11px] uppercase tracking-wide">
                          Claim Verification Answers:
                        </span>
                        {claim.answers.map((a, i) => (
                          <div key={i} className="text-stone-600">
                            <span className="font-medium text-stone-800">Q: {a.question_text}</span>
                            <p className="text-teal-900 bg-white p-1.5 rounded border border-stone-200 mt-0.5 font-mono text-[11px]">
                              A: {a.submitted_answer}
                            </p>
                          </div>
                        ))}
                      </div>

                      {claim.rejection_reason && (
                        <div className="p-2 bg-red-50 text-red-800 rounded text-xs">
                          <strong>Rejection Note:</strong> {claim.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {(isOwner || isAdmin) && (
              <>
                <button
                  onClick={() => onEditReport(report)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Report</span>
                </button>
                <button
                  onClick={() => onDeleteReport(report.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-900 bg-white border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                {!isReturned && (
                  <button
                    onClick={handleMarkReturned}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Returned</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOwner && isFound && !isReturned && (
              <button
                onClick={() => onOpenClaimModal(report)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors"
              >
                Claim This Item
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
