import React from 'react';
import {
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Package,
  ArrowRight
} from 'lucide-react';
import { ReportItem, UserProfile } from '../types.ts';

interface ReportCardProps {
  report: ReportItem;
  currentUser: UserProfile;
  onSelect: (report: ReportItem) => void;
  onClaim?: (report: ReportItem) => void;
  onFindMatches?: (report: ReportItem) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  currentUser,
  onSelect,
  onClaim,
  onFindMatches
}) => {
  const isOwner = report.user_id === currentUser.id;
  const isFound = report.type === 'found';
  const isReturned = report.status === 'returned';
  const isClaimPending = report.status === 'claim_pending';

  const formattedDate = new Date(report.date_occurred).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      onClick={() => onSelect(report)}
      className="group bg-white border border-stone-200 hover:border-stone-300 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
    >
      {/* Visual Header / Image Container */}
      <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
        {report.image_url ? (
          <img
            src={report.image_url}
            alt={report.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
            onError={(e) => {
              // Graceful fallback to styled icon box if image fails
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const fallback = parent.querySelector('.fallback-box') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }
            }}
          />
        ) : null}

        {/* Fallback container if no image or image fails */}
        <div
          className={`fallback-box w-full h-full ${
            report.image_url ? 'hidden' : 'flex'
          } flex-col items-center justify-center p-4 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400`}
        >
          <Package className="w-10 h-10 mb-1 stroke-[1.5]" />
          <span className="text-xs font-medium text-stone-500">{report.category}</span>
        </div>

        {/* Top Type Indicator (Lost vs Found) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md ${
              isFound
                ? 'bg-teal-900/90 text-teal-100 backdrop-blur-xs'
                : 'bg-amber-900/90 text-amber-100 backdrop-blur-xs'
            }`}
          >
            {report.type}
          </span>
          {isReturned && (
            <span className="text-[11px] font-medium bg-emerald-900/90 text-emerald-100 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              Returned
            </span>
          )}
          {isClaimPending && !isReturned && (
            <span className="text-[11px] font-medium bg-indigo-900/90 text-indigo-100 backdrop-blur-xs px-2 py-0.5 rounded-md">
              Reviewing Claim
            </span>
          )}
        </div>

        {/* Ownership badge if user reported it */}
        {isOwner && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-medium bg-stone-900/80 text-white backdrop-blur-xs px-2 py-0.5 rounded-md">
              Your Report
            </span>
          </div>
        )}

        {/* Verification Guard Icon on Found items */}
        {isFound && report.verification_questions && report.verification_questions.length > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-stone-900/75 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-300" />
            <span>2-Step Challenge</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Zero-Pill Clean Unboxed Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1.5 flex-wrap">
            <span className="font-medium text-stone-700">{report.category}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span>{report.primary_color}</span>
            {report.brand && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="font-medium text-stone-600">{report.brand}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-stone-900 text-sm leading-snug line-clamp-1 group-hover:text-teal-800 transition-colors">
            {report.title}
          </h3>

          {/* Description snippet */}
          <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {report.description}
          </p>

          {/* Location and Date Metadata */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-1 text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate">{report.location_zone} ({report.location_detail})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="mt-4 pt-2 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSelect(report)}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-1.5">
            {onFindMatches && (
              <button
                onClick={() => onFindMatches(report)}
                className="px-2 py-1 text-[11px] font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors flex items-center gap-1"
                title="Search matching reports"
              >
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>Matches</span>
              </button>
            )}

            {!isOwner && isFound && !isReturned && onClaim && (
              <button
                onClick={() => onClaim(report)}
                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
              >
                Claim Item
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
