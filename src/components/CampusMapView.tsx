import React from 'react';
import {
  MapPin,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CAMPUS_ZONES } from '../constants/campus.ts';

export const CampusMapView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
            <MapPin className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">
            Campus Safe Handover Directory
          </h1>
        </div>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
          To protect student personal safety and preserve physical chain of custody, CampusFind designates specific monitored university locations for returning belongings.
        </p>
      </div>

      {/* Safety Protocol Card */}
      <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2 text-xs text-teal-950">
        <div className="flex items-center gap-2 font-bold text-teal-900">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>University Safe Exchange Protocol:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-teal-900 text-[11px] leading-relaxed">
          <li><strong>Public Visibility:</strong> Only meet in designated, staff-attended campus counters. Never meet in private dormitory rooms or unlit parking structures.</li>
          <li><strong>Staff Witness:</strong> Front desk attendants can witness handover and sign off on returned property if needed.</li>
          <li><strong>Dual Confirmation:</strong> Both finder and claimant must tap "Confirm Pickup" in the app to record the transaction in the permanent university audit log.</li>
        </ul>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPUS_ZONES.map((zone) => (
          <div
            key={zone.id}
            className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-stone-500" />
                  <h3 className="font-bold text-stone-900 text-sm">
                    {zone.name}
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {zone.description}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                Designated Safe Counters:
              </span>
              <ul className="space-y-1.5 text-xs text-stone-700">
                {zone.safe_handover_spots.map((spot, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{spot}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
