import React from 'react';
import {
  Compass,
  Sparkles,
  Layers,
  MessageSquare,
  MapPin,
  Shield,
  Database,
  Lock,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types.ts';

export type ActiveTab =
  | 'catalog'
  | 'matches'
  | 'my-items'
  | 'messages'
  | 'campus-map'
  | 'admin'
  | 'supabase'
  | 'privacy';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  unreadCount: number;
  pendingClaimsCount: number;
  openReportCount: number;
  onOpenReportModal: (type?: 'lost' | 'found') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  unreadCount,
  pendingClaimsCount,
  openReportCount,
  onOpenReportModal
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'catalog',
      label: 'Campus Catalog',
      icon: Compass,
      badge: openReportCount > 0 ? openReportCount : undefined
    },
    {
      id: 'matches',
      label: 'Smart Match Radar',
      icon: Sparkles
    },
    {
      id: 'my-items',
      label: 'My Reports & Claims',
      icon: Layers,
      badge: pendingClaimsCount > 0 ? pendingClaimsCount : undefined
    },
    {
      id: 'messages',
      label: 'Private Coordination',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      id: 'campus-map',
      label: 'Verified Safe Zones',
      icon: MapPin
    },
    {
      id: 'admin',
      label: 'Admin & Security',
      icon: Shield,
      adminOnly: true
    },
    {
      id: 'supabase',
      label: 'Supabase & SQL Setup',
      icon: Database
    },
    {
      id: 'privacy',
      label: 'Privacy & Data Rights',
      icon: Lock
    }
  ];

  return (
    <aside className="w-64 bg-[#FBFBFA] border-r border-stone-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Quick Action Box */}
      <div className="p-4">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>Quick Report</span>
            <span className="text-[11px] font-mono text-stone-400">2 min</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-2.5 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-center transition-colors"
            >
              Lost Item
            </button>
            <button
              onClick={() => onOpenReportModal('found')}
              className="px-2.5 py-1.5 text-xs font-medium text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-center transition-colors"
            >
              Found Item
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRestricted = item.adminOnly && (!currentUser || currentUser.role !== 'admin');

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-stone-200/70 text-[#0F1E36] font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-stone-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  {item.badge}
                </span>
              )}

              {isRestricted && (
                <span className="text-[9px] font-mono uppercase text-stone-400 bg-stone-100 px-1 py-0.5 rounded">
                  Lock
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Campus Identity & Footer */}
      <div className="p-4 border-t border-stone-200 text-[11px] text-stone-500 space-y-1.5">
        <div className="flex items-center justify-between text-stone-700 font-medium">
          <span>Campus Integrity</span>
          <span className="font-mono text-[10px] text-teal-700">FERPA-Ready</span>
        </div>
        <p className="text-stone-400 text-[10px] leading-relaxed">
          Zero public contact numbers. Two-step ownership challenge prevents unauthorized claims.
        </p>
      </div>
    </aside>
  );
};
