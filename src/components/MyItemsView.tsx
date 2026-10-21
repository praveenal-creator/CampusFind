import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Package,
  Plus
} from 'lucide-react';
import { Claim, ReportItem, UserProfile } from '../types.ts';
import { storage } from '../services/storage.ts';

interface MyItemsViewProps {
  currentUser: UserProfile;
  reports: ReportItem[];
  claims: Claim[];
  onOpenReportModal: (type?: 'lost' | 'found') => void;
  onInspectReport: (report: ReportItem) => void;
  onEditReport: (report: ReportItem) => void;
  onDeleteReport: (reportId: string) => void;
  onOpenChat: (claimId: string) => void;
  onOpenReviewModal: (claim: Claim) => void;
}

export const MyItemsView: React.FC<MyItemsViewProps> = ({
  currentUser,
  reports,
  claims,
  onOpenReportModal,
  onInspectReport,
  onEditReport,
  onDeleteReport,
  onOpenChat,
  onOpenReviewModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'my-reports' | 'my-claims'>('my-reports');

  const myReports = reports.filter((r) => r.user_id === currentUser.id);
  const myClaims = claims.filter((c) => c.claimant_id === currentUser.id);

  // Claims filed by other students on my found reports
  const pendingClaimsOnMyItems = claims.filter(
    (c) =>
      c.status === 'under_review' &&
      myReports.some((r) => r.id === c.report_id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-stone-900">
              My Campus Postings & Claims
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Track status transitions, review incoming challenge submissions, and chat on approved claims.
          </p>
        </div>

        <button
          onClick={() => onOpenReportModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Campus Report</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('my-reports')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSubTab === 'my-reports'
              ? 'bg-[#0F1E36] text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          My Reports ({myReports.length})
        </button>
        <button
          onClick={() => setActiveSubTab('my-claims')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'my-claims'
              ? 'bg-[#0F1E36] text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span>My Filed Claims ({myClaims.length})</span>
        </button>

        {pendingClaimsOnMyItems.length > 0 && (
          <span className="ml-auto text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingClaimsOnMyItems.length} Incoming Claim Review(s)</span>
          </span>
        )}
      </div>

      {/* MY REPORTS TAB */}
      {activeSubTab === 'my-reports' && (
        <div className="space-y-4">
          {myReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200 p-6">
              <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-stone-700">No reports filed yet</h3>
              <p className="text-[11px] text-stone-400 mt-1 mb-4">
                Have you misplaced an item or found belongings on campus? File a report to trigger automated matching.
              </p>
              <button
                onClick={() => onOpenReportModal()}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800"
              >
                File Your First Report
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.map((report) => {
                const reportClaims = claims.filter((c) => c.report_id === report.id);
                const hasPending = reportClaims.some((c) => c.status === 'under_review');
                const approved = reportClaims.find((c) => c.status === 'approved' || c.status === 'returned');

                return (
                  <div
                    key={report.id}
                    className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                        {report.image_url ? (
                          <img
                            src={report.image_url}
                            alt={report.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 font-bold">
                            {report.category.slice(0, 3)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              report.type === 'found'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {report.type}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              report.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : report.status === 'claim_pending'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-stone-900 text-xs mt-1 truncate">
                          {report.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate">
                          {report.location_zone} · {new Date(report.date_occurred).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Claims status notification banner */}
                    {hasPending && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                        <span className="font-semibold text-[11px]">
                          Claim submitted by another student!
                        </span>
                        <button
                          onClick={() => {
                            const pendingClaim = reportClaims.find((c) => c.status === 'under_review');
                            if (pendingClaim) onOpenReviewModal(pendingClaim);
                          }}
                          className="px-2 py-1 bg-amber-700 text-white rounded font-semibold text-[10px]"
                        >
                          Review Answers
                        </button>
                      </div>
                    )}

                    {approved && (
                      <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs text-teal-900">
                        <span className="font-semibold text-[11px]">
                          Claim approved with {approved.claimant_name}
                        </span>
                        <button
                          onClick={() => onOpenChat(approved.id)}
                          className="px-2 py-1 bg-teal-700 text-white rounded font-semibold text-[10px] flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => onInspectReport(report)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        Inspect Details
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditReport(report)}
                          className="p-1 text-stone-500 hover:text-stone-800"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReport(report.id)}
                          className="p-1 text-stone-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MY FILED CLAIMS TAB */}
      {activeSubTab === 'my-claims' && (
        <div className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200 p-6">
              <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-stone-700">No claims submitted</h3>
              <p className="text-[11px] text-stone-400 mt-1">
                When you discover an item in the catalog matching your lost belonging, click "Claim Item" to submit verification answers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <div className="flex items-center gap-2">
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
                        Status: {claim.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        Attempt #{claim.attempt_count}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-900 text-sm mt-1">
                      {claim.report_title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
                      Filed on {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                    {claim.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        <strong>Reason:</strong> {claim.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(claim.status === 'approved' || claim.status === 'returned') && (
                      <button
                        onClick={() => onOpenChat(claim.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open Private Chat</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const r = storage.getReportById(claim.report_id);
                        if (r) onInspectReport(r);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
