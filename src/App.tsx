import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Compass,
  Sparkles,
  Layers,
  MapPin,
  Shield,
  RotateCcw,
  CheckCircle2,
  Calendar,
  X,
  SlidersHorizontal,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import {
  Claim,
  ItemCategory,
  ReportItem,
  ReportType,
  UserProfile,
  UserRole
} from './types.ts';
import { CAMPUS_ZONES, ITEM_CATEGORIES } from './constants/campus.ts';
import { storage, storageEvents } from './services/storage.ts';
import { supabase, isSupabaseConfigured } from './services/supabase.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { ReportCard } from './components/ReportCard.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { ItemDetailModal } from './components/ItemDetailModal.tsx';
import { ClaimModal } from './components/ClaimModal.tsx';
import { ClaimReviewModal } from './components/ClaimReviewModal.tsx';
import { PrivateChatDrawer } from './components/PrivateChatDrawer.tsx';
import { SafeHandoverModal } from './components/SafeHandoverModal.tsx';
import { AdminConsole } from './components/AdminConsole.tsx';
import { MatchesView } from './components/MatchesView.tsx';
import { MyItemsView } from './components/MyItemsView.tsx';
import { CampusMapView } from './components/CampusMapView.tsx';
import { SupabaseSetupModal } from './components/SupabaseSetupModal.tsx';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { SignUpPage } from './components/SignUpPage.tsx';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(storage.getCurrentUser());
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // App Data State
  const [reports, setReports] = useState<ReportItem[]>(storage.getReports());
  const [claims, setClaims] = useState<Claim[]>(storage.getClaims());
  const [auditLogs, setAuditLogs] = useState(storage.getAuditLogs());
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filters for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'returned'>('open');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'date_occurred'>('newest');

  // Modals & Drawers
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [initialReportType, setInitialReportType] = useState<ReportType>('lost');
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimReport, setClaimReport] = useState<ReportItem | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewClaim, setReviewClaim] = useState<Claim | null>(null);

  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [activeChatClaimId, setActiveChatClaimId] = useState<string | null>(null);

  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverClaimId, setHandoverClaimId] = useState<string | null>(null);

  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Toast / Status banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync state with storage events
  const refreshAll = () => {
    setCurrentUser(storage.getCurrentUser());
    setReports(storage.getReports());
    setClaims(storage.getClaims());
    setAuditLogs(storage.getAuditLogs());
  };

  // Restore Supabase Session on page load & listen for auth changes
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const user = session.user;
          const role: UserRole =
            (user.user_metadata?.role as UserRole) ||
            (user.email?.toLowerCase().includes('admin') ? 'admin' : 'student');
          const profile: UserProfile = {
            id: user.id,
            email: user.email || '',
            full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Campus Student',
            role,
            campus_domain: (user.user_metadata?.campus_domain as string) || user.email?.split('@')[1] || 'university.edu',
            created_at: user.created_at || new Date().toISOString()
          };
          setCurrentUser(profile);
          storage.setCurrentUser(profile);
        } else if (isMounted) {
          setCurrentUser(null);
          storage.setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to restore Supabase session:', err);
        if (isMounted) {
          setCurrentUser(null);
          storage.setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    restoreSession();

    // Listen for auth state events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const user = session.user;
        const role: UserRole =
          (user.user_metadata?.role as UserRole) ||
          (user.email?.toLowerCase().includes('admin') ? 'admin' : 'student');
        const profile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Campus Student',
          role,
          campus_domain: (user.user_metadata?.campus_domain as string) || user.email?.split('@')[1] || 'university.edu',
          created_at: user.created_at || new Date().toISOString()
        };
        setCurrentUser(profile);
        storage.setCurrentUser(profile);
      } else {
        setCurrentUser(null);
        storage.setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    refreshAll();
    const handleUpdate = () => refreshAll();

    storageEvents.addEventListener('reports_changed', handleUpdate);
    storageEvents.addEventListener('claims_changed', handleUpdate);
    storageEvents.addEventListener('user_changed', handleUpdate);
    storageEvents.addEventListener('audit_changed', handleUpdate);

    return () => {
      storageEvents.removeEventListener('reports_changed', handleUpdate);
      storageEvents.removeEventListener('claims_changed', handleUpdate);
      storageEvents.removeEventListener('user_changed', handleUpdate);
      storageEvents.removeEventListener('audit_changed', handleUpdate);
    };
  }, []);

  // Filter Catalog Reports
  const filteredReports = reports
    .filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (zoneFilter !== 'all' && r.location_zone !== zoneFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'open' && r.status !== 'open' && r.status !== 'claim_pending') return false;
        if (statusFilter === 'returned' && r.status !== 'returned') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesBrand = r.brand?.toLowerCase().includes(q) || false;
        const matchesColor = r.primary_color.toLowerCase().includes(q);
        const matchesLoc = r.location_zone.toLowerCase().includes(q) || r.location_detail.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesBrand && !matchesColor && !matchesLoc) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'date_occurred') {
        return new Date(b.date_occurred).getTime() - new Date(a.date_occurred).getTime();
      }
      return 0;
    });

  // Auth Handlers
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      storage.setCurrentUser(null);
      setAuthView('login');
      setAuthNotice('You have been securely signed out of CampusFind.');
      showToast('Signed out successfully');
    } catch (err: unknown) {
      console.error('Sign out error:', err);
    }
  };

  const handleOpenReportModal = (type: ReportType = 'lost') => {
    if (!currentUser) {
      setAuthView('login');
      setAuthNotice('Please sign in to file or update campus reports.');
      return;
    }
    setInitialReportType(type);
    setEditingReport(null);
    setReportModalOpen(true);
  };

  const handleEditReport = (report: ReportItem) => {
    setEditingReport(report);
    setReportModalOpen(true);
    setDetailModalOpen(false);
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you wish to delete this report?')) {
      storage.deleteReport(reportId);
      setDetailModalOpen(false);
      showToast('Report deleted successfully');
    }
  };

  const handleOpenClaim = (report: ReportItem) => {
    if (!currentUser) {
      setAuthView('login');
      setAuthNotice('Please sign in to claim a found item.');
      return;
    }
    setClaimReport(report);
    setClaimModalOpen(true);
    setDetailModalOpen(false);
  };

  const handleOpenReview = (claim: Claim) => {
    setReviewClaim(claim);
    setReviewModalOpen(true);
    setDetailModalOpen(false);
  };

  const handleOpenChat = (claimId: string) => {
    setActiveChatClaimId(claimId);
    setChatDrawerOpen(true);
    setDetailModalOpen(false);
    setReviewModalOpen(false);
  };

  const handleOpenHandover = (claimId: string) => {
    setHandoverClaimId(claimId);
    setHandoverModalOpen(true);
  };

  const handleResetDemo = () => {
    if (confirm('Reset application state back to initial collegiate sample data?')) {
      storage.resetDemoData();
      showToast('Sample campus data refreshed');
    }
  };

  // Badges calculation
  const openReportCount = reports.filter((r) => r.status === 'open').length;
  const userPendingClaims = currentUser
    ? claims.filter(
        (c) =>
          c.status === 'under_review' &&
          (c.claimant_id === currentUser.id ||
            reports.some((r) => r.id === c.report_id && r.user_id === currentUser.id))
      ).length
    : 0;

  // Render Loading Screen while checking Supabase session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-[#0F1E36] text-teal-400 flex items-center justify-center shadow-lg animate-pulse mb-3">
          <span className="font-serif font-bold text-lg">CF</span>
        </div>
        <p className="text-xs font-semibold text-stone-700">Restoring CampusFind Session...</p>
        <span className="text-[11px] text-stone-400 mt-1 font-mono">Supabase Auth</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col text-[#0F1E36]">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onNavigateToLogin={() => {
          setAuthNotice(null);
          setAuthView('login');
        }}
        onNavigateToSignUp={() => {
          setAuthNotice(null);
          setAuthView('signup');
        }}
        onOpenReportModal={() => handleOpenReportModal()}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onOpenMatchesView={() => setActiveTab('matches')}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0F1E36] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PROTECTED AUTHENTICATION GATEWAY: If user is logged out, show Login or Sign Up */}
      {!currentUser ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-center">
          {authView === 'login' ? (
            <LoginPage
              onSuccess={() => {
                showToast('Welcome back to CampusFind!');
              }}
              onNavigateToSignUp={() => {
                setAuthNotice(null);
                setAuthView('signup');
              }}
              onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
              initialMessage={authNotice}
            />
          ) : (
            <SignUpPage
              onSuccess={(requiresEmailVerification) => {
                if (requiresEmailVerification) {
                  setAuthNotice(
                    'Registration successful! Please check your email to verify your campus account before logging in.'
                  );
                  setAuthView('login');
                } else {
                  showToast('Account created! Welcome to CampusFind.');
                }
              }}
              onNavigateToLogin={() => {
                setAuthNotice(null);
                setAuthView('login');
              }}
              onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
            />
          )}
        </main>
      ) : (
        /* AUTHENTICATED WORKSPACE */
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block shrink-0">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                if (tab === 'supabase') setSupabaseModalOpen(true);
                else if (tab === 'privacy') setPrivacyModalOpen(true);
                else setActiveTab(tab);
              }}
              currentUser={currentUser}
              unreadCount={0}
              pendingClaimsCount={userPendingClaims}
              openReportCount={openReportCount}
              onOpenReportModal={handleOpenReportModal}
            />
          </div>

          {/* Mobile Slide-out Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex bg-stone-900/60 backdrop-blur-xs">
              <div className="w-72 bg-white h-full shadow-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                    <span className="font-bold text-sm text-stone-900">Navigation</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-stone-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <Sidebar
                    activeTab={activeTab}
                    onSelectTab={(tab) => {
                      setMobileMenuOpen(false);
                      if (tab === 'supabase') setSupabaseModalOpen(true);
                      else if (tab === 'privacy') setPrivacyModalOpen(true);
                      else setActiveTab(tab);
                    }}
                    currentUser={currentUser}
                    unreadCount={0}
                    pendingClaimsCount={userPendingClaims}
                    openReportCount={openReportCount}
                    onOpenReportModal={(t) => {
                      setMobileMenuOpen(false);
                      handleOpenReportModal(t);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            {/* TAB 1: CATALOG VIEW */}
            {activeTab === 'catalog' && (
              <div className="space-y-6">
                {/* Hero Banner Strip */}
                <div className="p-6 bg-gradient-to-r from-[#0F1E36] to-[#1E3A5F] rounded-2xl text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-xs font-semibold">
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Campus Recovery Network</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                      Recover Belongings. Preserve Campus Integrity.
                    </h1>
                    <p className="text-stone-300 text-xs max-w-xl leading-relaxed">
                      Search authenticated lost and found items. Powered by deterministic smart matching, two-step challenge verification, and verified safe campus pick-up points.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReportModal('lost')}
                      className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                    >
                      I Lost Something
                    </button>
                    <button
                      onClick={() => handleOpenReportModal('found')}
                      className="px-3.5 py-2 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-stone-950 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                    >
                      I Found Something
                    </button>
                  </div>
                </div>

                {/* Interactive Search & Filter Toolbar */}
                <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search bar */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by keywords, brand, color, or location..."
                        className="w-full pl-9 pr-8 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-stone-50/50"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Lost / Found Segmented Filter Buttons */}
                    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg shrink-0">
                      <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          typeFilter === 'all'
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        All Types
                      </button>
                      <button
                        onClick={() => setTypeFilter('lost')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          typeFilter === 'lost'
                            ? 'bg-white text-amber-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Lost Only
                      </button>
                      <button
                        onClick={() => setTypeFilter('found')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          typeFilter === 'found'
                            ? 'bg-white text-teal-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Found Only
                      </button>
                    </div>
                  </div>

                  {/* Secondary Filters Strip */}
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 font-medium">Category:</span>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-2 py-1 text-xs border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                      >
                        <option value="all">All Categories</option>
                        {ITEM_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 font-medium">Campus Zone:</span>
                      <select
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        className="px-2 py-1 text-xs border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 max-w-xs truncate"
                      >
                        <option value="all">All Campus Zones</option>
                        {CAMPUS_ZONES.map((zone) => (
                          <option key={zone.id} value={zone.name}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 font-medium">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-2 py-1 text-xs border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                      >
                        <option value="open">Active / Open</option>
                        <option value="returned">Safely Returned</option>
                        <option value="all">All Statuses</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-stone-400 font-medium">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-2 py-1 text-xs border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono"
                      >
                        <option value="newest">Recently Reported</option>
                        <option value="date_occurred">Date Occurred</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                    <span>
                      Showing <strong>{filteredReports.length}</strong> campus postings
                    </span>
                    <button
                      onClick={handleResetDemo}
                      className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
                      title="Refresh sample postings"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Refresh Sample Postings</span>
                    </button>
                  </div>

                  {filteredReports.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-stone-800 text-sm">
                        No matching reports found
                      </h3>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        Try relaxing your search terms or changing your campus zone filter.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setTypeFilter('all');
                          setCategoryFilter('all');
                          setZoneFilter('all');
                          setStatusFilter('all');
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors inline-block"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredReports.map((report) => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          currentUser={currentUser}
                          onSelect={(r) => {
                            setSelectedReport(r);
                            setDetailModalOpen(true);
                          }}
                          onClaim={handleOpenClaim}
                          onFindMatches={(r) => {
                            setSelectedReport(r);
                            setActiveTab('matches');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SMART MATCH RADAR */}
            {activeTab === 'matches' && (
              <MatchesView
                reports={reports}
                currentUser={currentUser}
                onInspectReport={(r) => {
                  setSelectedReport(r);
                  setDetailModalOpen(true);
                }}
                onOpenClaimModal={handleOpenClaim}
              />
            )}

            {/* TAB 3: MY REPORTS & CLAIMS */}
            {activeTab === 'my-items' && (
              <MyItemsView
                currentUser={currentUser}
                reports={reports}
                claims={claims}
                onOpenReportModal={handleOpenReportModal}
                onInspectReport={(r) => {
                  setSelectedReport(r);
                  setDetailModalOpen(true);
                }}
                onEditReport={handleEditReport}
                onDeleteReport={handleDeleteReport}
                onOpenChat={handleOpenChat}
                onOpenReviewModal={handleOpenReview}
              />
            )}

            {/* TAB 4: PRIVATE MESSAGING / COORDINATION */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-stone-200">
                  <h1 className="text-xl font-bold text-stone-900">
                    Private Claim Coordination
                  </h1>
                  <p className="text-xs text-stone-500 mt-1">
                    Private conversations unlocked between verified claimants and item finders with Row Level Security.
                  </p>
                </div>

                {claims.filter((c) => c.status === 'approved' || c.status === 'returned').length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-stone-200 p-6">
                    <Shield className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <h3 className="text-xs font-bold text-stone-700">No active conversations</h3>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Direct messaging unlocks automatically as soon as an item finder or campus administrator approves an ownership claim.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims
                      .filter((c) => c.status === 'approved' || c.status === 'returned')
                      .map((c) => (
                        <div
                          key={c.id}
                          className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-stone-900">
                                Re: {c.report_title}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full capitalize">
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              Claimant: <strong>{c.claimant_name}</strong> ({c.claimant_email})
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenChat(c.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
                          >
                            Open Chat & Handover
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CAMPUS SAFE ZONES */}
            {activeTab === 'campus-map' && <CampusMapView />}

            {/* TAB 6: ADMIN MODERATION CONSOLE */}
            {activeTab === 'admin' && (
              <AdminConsole
                currentUser={currentUser}
                reports={reports}
                claims={claims}
                auditLogs={auditLogs}
                onRefreshData={refreshAll}
                onInspectReport={(r) => {
                  setSelectedReport(r);
                  setDetailModalOpen(true);
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* MODALS (Accessible when user is authenticated) */}
      {currentUser && (
        <>
          <ReportModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            currentUser={currentUser}
            initialType={initialReportType}
            editingReport={editingReport}
            onSave={(saved) => {
              refreshAll();
              showToast(`Report "${saved.title}" saved successfully`);
            }}
          />

          <ItemDetailModal
            report={selectedReport}
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            currentUser={currentUser}
            allReports={reports}
            onOpenClaimModal={handleOpenClaim}
            onOpenReviewModal={handleOpenReview}
            onOpenChat={handleOpenChat}
            onEditReport={handleEditReport}
            onDeleteReport={handleDeleteReport}
            onSelectCandidate={(cand) => {
              setSelectedReport(cand);
            }}
          />

          <ClaimModal
            report={claimReport}
            isOpen={claimModalOpen}
            onClose={() => setClaimModalOpen(false)}
            currentUser={currentUser}
            onSuccess={(c) => {
              refreshAll();
              showToast(`Claim for "${c.report_title}" submitted for finder review!`);
            }}
          />

          <ClaimReviewModal
            claim={reviewClaim}
            report={reviewClaim ? storage.getReportById(reviewClaim.report_id) || null : null}
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            currentUser={currentUser}
            onReviewed={(c) => {
              refreshAll();
              showToast(`Claim #${c.id} updated to ${c.status}`);
            }}
            onOpenChat={handleOpenChat}
          />

          <PrivateChatDrawer
            claimId={activeChatClaimId}
            isOpen={chatDrawerOpen}
            onClose={() => setChatDrawerOpen(false)}
            currentUser={currentUser}
            onOpenHandoverModal={handleOpenHandover}
          />

          <SafeHandoverModal
            claimId={handoverClaimId}
            isOpen={handoverModalOpen}
            onClose={() => setHandoverModalOpen(false)}
            onScheduled={() => {
              refreshAll();
              showToast('Safe handover scheduled at verified campus station');
            }}
          />

          <PrivacyNoticeModal
            isOpen={privacyModalOpen}
            onClose={() => setPrivacyModalOpen(false)}
            currentUser={currentUser}
            onDataDeleted={() => {
              refreshAll();
              showToast('User records successfully purged under right to erasure.');
            }}
          />
        </>
      )}

      {/* Supabase Setup Modal (Accessible in both modes) */}
      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
}
