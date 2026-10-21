import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Flag,
  RotateCcw,
  Plus,
  Lock,
  Search,
  ExternalLink,
  UserCheck,
  History,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AuditLog, Claim, ReportItem, UserProfile } from '../types.ts';
import { storage } from '../services/storage.ts';
import { DEMO_USERS } from '../constants/campus.ts';

interface AdminConsoleProps {
  currentUser: UserProfile;
  reports: ReportItem[];
  claims: Claim[];
  auditLogs: AuditLog[];
  onSwitchToAdmin?: () => void;
  onRefreshData: () => void;
  onInspectReport: (report: ReportItem) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  reports,
  claims,
  auditLogs,
  onSwitchToAdmin,
  onRefreshData,
  onInspectReport
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'reports' | 'claims' | 'domains' | 'audit'>('overview');
  const [reportSearch, setReportSearch] = useState('');
  const [flagReasonInput, setFlagReasonInput] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [newDomainInput, setNewDomainInput] = useState('');

  const isAdmin = currentUser.role === 'admin';

  // Authorization Guard: Strict restriction
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">
          Campus Administrator Console Restricted
        </h2>
        <p className="text-stone-600 text-xs max-w-md mx-auto mt-2 leading-relaxed">
          Access to campus moderation tools, audit logs, and domain restrictions requires official university administrative privileges. You are currently signed in as <strong>{currentUser.full_name} ({currentUser.role})</strong>. Please log in with a verified campus administrator account.
        </p>
      </div>
    );
  }

  // Real Database Calculations
  const totalReports = reports.length;
  const returnedReports = reports.filter((r) => r.status === 'returned').length;
  const openReports = reports.filter((r) => r.status === 'open').length;
  const pendingClaims = claims.filter((c) => c.status === 'under_review').length;
  const flaggedReports = reports.filter((r) => r.is_flagged).length;
  const recoveryRate = totalReports > 0 ? Math.round((returnedReports / totalReports) * 100) : 0;

  const allowedDomains = storage.getAllowedDomains();

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    let clean = newDomainInput.trim().toLowerCase();
    if (!clean.startsWith('.')) clean = `.${clean}`;
    if (!allowedDomains.includes(clean)) {
      storage.setAllowedDomains([...allowedDomains, clean]);
      setNewDomainInput('');
      onRefreshData();
    }
  };

  const handleRemoveDomain = (domain: string) => {
    if (allowedDomains.length <= 1) {
      alert('At least one campus domain must remain active.');
      return;
    }
    storage.setAllowedDomains(allowedDomains.filter((d) => d !== domain));
    onRefreshData();
  };

  const handleToggleFlag = (report: ReportItem) => {
    if (report.is_flagged) {
      storage.unflagReport(report.id);
      onRefreshData();
    } else {
      setSelectedReportId(report.id);
    }
  };

  const handleConfirmFlag = () => {
    if (selectedReportId) {
      storage.flagReport(selectedReportId, flagReasonInput.trim() || 'Flagged by campus administrator');
      setSelectedReportId(null);
      setFlagReasonInput('');
      onRefreshData();
    }
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this report from campus records?')) {
      storage.deleteReport(id);
      onRefreshData();
    }
  };

  const handleForceReturnClaim = (claimId: string) => {
    if (confirm('Mark this claim as returned and close corresponding report?')) {
      storage.updateClaimStatus(claimId, 'returned');
      onRefreshData();
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.location_zone.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.user_name.toLowerCase().includes(reportSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-800">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-stone-900">
              Campus Security & Administration
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Authoritative moderation, disputes resolution, email domain enforcement, and immutable audit logs.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSection === 'overview'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('reports')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSection === 'reports'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Moderate Reports ({flaggedReports > 0 ? `! ${flaggedReports}` : reports.length})
          </button>
          <button
            onClick={() => setActiveSection('claims')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSection === 'claims'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Disputed Claims ({pendingClaims})
          </button>
          <button
            onClick={() => setActiveSection('domains')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSection === 'domains'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Campus Domains
          </button>
          <button
            onClick={() => setActiveSection('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSection === 'audit'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* OVERVIEW SECTION: Real Calculated Metrics */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Total Campus Reports
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1">
                {totalReports}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                {openReports} currently open
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Items Recovered
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                {returnedReports}
              </div>
              <span className="text-[11px] text-emerald-600 mt-1 block">
                Safely returned
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Recovery Success Rate
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-teal-700 mt-1">
                {recoveryRate}%
              </div>
              <span className="text-[11px] text-teal-600 mt-1 block">
                Campus-wide recovery
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Pending Verification
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
                {pendingClaims}
              </div>
              <span className="text-[11px] text-amber-600 mt-1 block">
                Claims awaiting review
              </span>
            </div>
          </div>

          {/* Quick Flagged Attention Queue */}
          {flaggedReports > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-red-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{flaggedReports} Report(s) Flagged for Administrative Moderation</span>
              </div>
              <p className="text-[11px] text-red-800 mb-3">
                Items reported by students for suspicious content or inaccurate location claims.
              </p>
              <button
                onClick={() => setActiveSection('reports')}
                className="px-3 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-colors"
              >
                Inspect Flagged Reports
              </button>
            </div>
          )}

          {/* Recent Audit Activity Snapshot */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Recent Security Audit Events
              </h3>
              <button
                onClick={() => setActiveSection('audit')}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium"
              >
                View Full Log
              </button>
            </div>
            <div className="divide-y divide-stone-100 text-xs">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-stone-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <strong className="text-stone-800 font-semibold">{log.actor_name}</strong>
                    <span className="text-stone-500 font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 capitalize">{log.target_type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORTS MODERATION SECTION */}
      {activeSection === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search reports by title, zone, or student name..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              />
            </div>
            <span className="text-xs text-stone-500 font-mono">
              {filteredReports.length} records
            </span>
          </div>

          {/* Flag Prompt Modal / Card */}
          {selectedReportId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-950">
                Set Moderation Flag Reason for Report #{selectedReportId}:
              </span>
              <input
                type="text"
                value={flagReasonInput}
                onChange={(e) => setFlagReasonInput(e.target.value)}
                placeholder="e.g. Duplicate report, prohibited item, or inaccurate details..."
                className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="px-3 py-1 text-xs text-stone-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmFlag}
                  className="px-3 py-1 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
                >
                  Apply Flag
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Item Title & Zone</th>
                  <th className="p-3">Type / Category</th>
                  <th className="p-3">Reporter</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/50">
                    <td className="p-3">
                      <div className="font-semibold text-stone-900 hover:text-teal-700 cursor-pointer" onClick={() => onInspectReport(r)}>
                        {r.title}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {r.location_zone} ({r.location_detail})
                      </div>
                      {r.is_flagged && (
                        <div className="text-[10px] text-red-600 font-semibold mt-0.5">
                          FLAGGED: {r.flag_reason || 'Under review'}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-stone-700 capitalize">{r.type}</span>
                      <div className="text-[11px] text-stone-400">{r.category}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{r.user_name}</span>
                      <div className="text-[10px] text-stone-400">{r.user_email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          r.status === 'returned'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'claim_pending'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleFlag(r)}
                          className={`p-1.5 rounded-md transition-colors ${
                            r.is_flagged
                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                              : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                          }`}
                          title={r.is_flagged ? 'Clear flag' : 'Flag report'}
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onInspectReport(r)}
                          className="p-1.5 text-stone-600 hover:text-teal-700 hover:bg-stone-100 rounded-md transition-colors"
                          title="Inspect item"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(r.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPUTED CLAIMS SECTION */}
      {activeSection === 'claims' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Claimant</th>
                  <th className="p-3">Item Claimed</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {claims.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{c.claimant_name}</div>
                      <div className="text-[10px] text-stone-400">{c.claimant_email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-stone-800">{c.report_title}</div>
                      <div className="text-[10px] text-stone-400 font-mono">ID: {c.report_id}</div>
                    </td>
                    <td className="p-3 font-mono tabular-nums text-stone-700">
                      {c.attempt_count} / 3
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          c.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : c.status === 'returned'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {c.status !== 'returned' && (
                        <button
                          onClick={() => handleForceReturnClaim(c.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
                        >
                          Confirm Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAMPUS EMAIL DOMAINS SECTION */}
      {activeSection === 'domains' && (
        <div className="max-w-2xl bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Configured Campus Email Domains
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              Restrict student registration and reporting to approved collegiate email suffixes. Never assumes all institutions share the same domain.
            </p>
          </div>

          <form onSubmit={handleAddDomain} className="flex gap-2">
            <input
              type="text"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
              placeholder="e.g. .edu, .ac.uk, .mit.edu, .berkeley.edu"
              className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Domain</span>
            </button>
          </form>

          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              Active Whitelisted Suffixes:
            </span>
            <div className="flex flex-wrap gap-2">
              {allowedDomains.map((dom) => (
                <div
                  key={dom}
                  className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-xs font-mono text-stone-800"
                >
                  <span>{dom}</span>
                  <button
                    onClick={() => handleRemoveDomain(dom)}
                    className="text-stone-400 hover:text-red-600 transition-colors"
                    title="Remove domain"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* IMMUTABLE AUDIT LOG SECTION */}
      {activeSection === 'audit' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                System Security & Administrative Audit Log
              </h3>
              <p className="text-[11px] text-stone-500">
                Timestamped ledger of report actions, claim approvals, handovers, and domain modifications.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">
              {auditLogs.length} entries
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-stone-50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-stone-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <strong className="text-stone-800">{log.actor_name}</strong>
                  </div>
                  <p className="text-[11px] text-stone-600 font-mono">
                    Target: {log.target_type} ({log.target_id})
                  </p>
                  <pre className="text-[10px] bg-stone-50 p-2 rounded border border-stone-200 text-stone-600 overflow-x-auto font-mono">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
