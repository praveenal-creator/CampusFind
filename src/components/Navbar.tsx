import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Plus,
  Sparkles,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  LogIn,
  UserPlus
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { isSupabaseConfigured } from '../services/supabase.ts';

interface NavbarProps {
  currentUser: UserProfile | null;
  onSignOut: () => void;
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
  onOpenReportModal: (type?: 'lost' | 'found') => void;
  onOpenSupabaseModal: () => void;
  onOpenMatchesView: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSignOut,
  onNavigateToLogin,
  onNavigateToSignUp,
  onOpenReportModal,
  onOpenSupabaseModal,
  onOpenMatchesView,
  mobileMenuOpen,
  onToggleMobileMenu
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser && (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <a href="#" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-[#0F1E36] flex items-center justify-center text-teal-400 font-bold shadow-xs transition-transform group-hover:scale-105">
                <span className="text-base font-serif tracking-tight">CF</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-[#0F1E36] tracking-tight leading-none">
                  CampusFind
                </span>
                <span className="text-[11px] text-stone-500 font-medium tracking-wide">
                  Collegiate Network
                </span>
              </div>
            </a>
          </div>

          {/* Quick Actions & Navigation (When Logged In) */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser && (
              <button
                onClick={onOpenMatchesView}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Smart Match Radar</span>
              </button>
            )}

            {/* Supabase Status Button */}
            <button
              onClick={onOpenSupabaseModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title="Click to view Supabase database setup & SQL migrations"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Setup'}</span>
            </button>
          </div>

          {/* User Account / Auth Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <>
                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-stone-100/90 hover:bg-stone-200/90 rounded-lg cursor-pointer transition-colors border border-stone-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0F1E36] text-teal-300 font-bold text-xs flex items-center justify-center">
                      {currentUser.full_name ? currentUser.full_name.slice(0, 2).toUpperCase() : 'ST'}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-semibold text-stone-800 leading-tight">
                        {currentUser.full_name}
                      </span>
                      <span className="text-[10px] text-stone-500 capitalize leading-none">
                        {currentUser.role === 'admin' ? 'Campus Admin' : 'Student'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in-50">
                        <div className="px-3.5 py-2 border-b border-stone-100">
                          <p className="text-xs font-bold text-stone-800 truncate">
                            {currentUser.full_name}
                          </p>
                          <p className="text-[11px] text-stone-500 font-mono truncate">
                            {currentUser.email}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 capitalize">
                            Role: {currentUser.role}
                          </span>
                        </div>

                        <div className="p-1">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onSignOut();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4 text-red-600" />
                            <span>Sign Out of CampusFind</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={() => onOpenReportModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report Item</span>
                </button>
              </>
            ) : (
              /* Public / Logged Out Navbar State */
              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={onNavigateToSignUp}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
