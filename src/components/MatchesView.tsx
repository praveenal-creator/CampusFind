import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Package,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { MatchResult, ReportItem, UserProfile } from '../types.ts';
import { findTopMatches } from '../services/matchEngine.ts';

interface MatchesViewProps {
  reports: ReportItem[];
  currentUser: UserProfile;
  onInspectReport: (report: ReportItem) => void;
  onOpenClaimModal: (report: ReportItem) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  reports,
  currentUser,
  onInspectReport,
  onOpenClaimModal
}) => {
  // Let user pick which report to calculate matches for
  const userReports = reports.filter((r) => r.user_id === currentUser.id && r.status === 'open');
  const otherOpenReports = reports.filter((r) => r.user_id !== currentUser.id && r.status === 'open');

  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    userReports[0]?.id || reports[0]?.id || ''
  );

  const selectedReport = reports.find((r) => r.id === selectedTargetId);
  const matches = selectedReport ? findTopMatches(selectedReport, reports, 25) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-stone-900">
              Explainable Smart Match Radar
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Deterministic token similarity and multi-factor evaluation between Lost and Found postings. Real weights for category (30%), brand (20%), color (15%), campus zone (15%), date proximity (10%), and keyword overlap (10%).
          </p>
        </div>

        {/* Report Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-stone-600 whitespace-nowrap">
            Target Report:
          </label>
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 max-w-xs truncate"
          >
            {userReports.length > 0 && (
              <optgroup label="Your Open Reports">
                {userReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.type.toUpperCase()}] {r.title}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="All Campus Reports">
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.type.toUpperCase()}] {r.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Target Report Context Strip */}
      {selectedReport && (
        <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-xs flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
              {selectedReport.image_url ? (
                <img
                  src={selectedReport.image_url}
                  alt={selectedReport.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                  {selectedReport.category.slice(0, 3)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    selectedReport.type === 'found'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedReport.type}
                </span>
                <span className="text-xs text-stone-500">
                  {selectedReport.location_zone}
                </span>
                <span className="text-stone-300">·</span>
                <span className="text-xs text-stone-500">
                  {selectedReport.category}
                </span>
              </div>
              <h3 className="font-bold text-stone-900 text-sm mt-0.5">
                {selectedReport.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onInspectReport(selectedReport)}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors"
            >
              View Full Report
            </button>
          </div>
        </div>
      )}

      {/* Matches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Matching Candidates ({matches.length})
          </h2>
          <span className="text-[11px] text-stone-400 font-mono">
            Sorted by Weighted Deterministic Score
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200 p-6">
            <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-stone-700">No cross-matches found for this report</h4>
            <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
              Our deterministic algorithm did not find opposite {selectedReport?.type === 'lost' ? 'found' : 'lost'} items exceeding the 25% similarity threshold.
            </p>
          </div>
        ) : (
          matches.map((res) => {
            const cand = res.candidate_report;
            return (
              <div
                key={cand.id}
                className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs hover:border-teal-400 transition-all space-y-4"
              >
                {/* Header & Candidate Summary */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                      {cand.image_url ? (
                        <img
                          src={cand.image_url}
                          alt={cand.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 font-bold">
                          {cand.category.slice(0, 3)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            cand.type === 'found'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cand.type}
                        </span>
                        <span className="font-medium text-stone-700">{cand.category}</span>
                        <span>·</span>
                        <span>{cand.location_zone}</span>
                        <span>·</span>
                        <span>{new Date(cand.date_occurred).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm mt-1">
                        {cand.title}
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {cand.description}
                      </p>
                    </div>
                  </div>

                  {/* Big Percentage Score */}
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-baseline gap-1 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
                      <span className="text-xl font-bold font-mono tabular-nums leading-none">
                        {res.total_score}
                      </span>
                      <span className="text-xs font-semibold">% Match</span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => onInspectReport(cand)}
                        className="px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                      >
                        Details
                      </button>

                      {cand.type === 'found' && cand.user_id !== currentUser.id && (
                        <button
                          onClick={() => onOpenClaimModal(cand)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mathematical Factor Contributions */}
                <div className="pt-3 border-t border-stone-100">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                    Why This Match Was Suggested:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                    {res.factors.map((f, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                          <span>{f.factor}</span>
                          <span className="font-mono text-teal-700">+{f.contribution}%</span>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight" title={f.explanation}>
                          {f.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
