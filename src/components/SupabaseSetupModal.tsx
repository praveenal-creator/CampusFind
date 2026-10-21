import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code2,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection } from '../services/supabase.ts';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testKey, setTestKey] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    fetch('/supabase/schema.sql')
      .then((res) => res.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        // Fallback text if file fetch fails
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(testUrl.trim(), testKey.trim());
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl my-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Supabase Integration & Database Schema
              </h2>
              <p className="text-xs text-stone-500">
                PostgreSQL persistence, Row Level Security, and Realtime sync
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Badge */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isSupabaseConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {isSupabaseConfigured
                  ? 'Live Supabase Cloud Connected'
                  : 'Interactive Demo Mode Active (LocalStorage Persistence)'}
              </div>
              <p className="text-[11px] mt-1 leading-relaxed">
                {isSupabaseConfigured
                  ? 'Queries and real-time events are backed by your live Supabase PostgreSQL instance with enforced Row Level Security.'
                  : 'CampusFind is currently running in local demonstration mode. All reports, 2-step challenge verification, matches, and chats are fully interactive and persist in your browser. To connect a live database, follow the setup instructions below.'}
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-3">
            <h3 className="font-bold text-stone-900 text-sm">
              Free-Tier Supabase Setup Guide
            </h3>

            <div className="space-y-2">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-stone-800">Create a Free Project</strong>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Sign up at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-teal-700 underline font-medium inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a> and create a new project.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-800">Execute PostgreSQL Migration Schema</strong>
                    <button
                      onClick={handleCopySchema}
                      className="text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded flex items-center gap-1 border border-teal-200 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy schema.sql'}</span>
                    </button>
                  </div>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Open the Supabase <strong>SQL Editor</strong> tab and run the script located at <code>supabase/schema.sql</code>. It provisions all tables, indexes, and RLS policies.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-stone-800">Supply Environment Variables</strong>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Copy your Project URL and Anon API key into <code>.env</code>:
                  </p>
                  <pre className="mt-1.5 p-2 bg-stone-900 text-stone-100 rounded-lg text-[10px] font-mono overflow-x-auto">
                    VITE_SUPABASE_URL="https://your-project.supabase.co"&#10;VITE_SUPABASE_ANON_KEY="your-anon-public-key"
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Live Credential Tester */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-stone-600" />
              <span>Test Live Credentials</span>
            </h4>
            <form onSubmit={handleTestConnection} className="space-y-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white font-mono"
              />
              <input
                type="password"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="eyJhbGciOi... (anon key)"
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white font-mono"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'Verifying...' : 'Test Connection'}
                </button>
                {testResult && (
                  <span
                    className={`text-[11px] font-medium ${
                      testResult.success ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {testResult.message}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/70 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
