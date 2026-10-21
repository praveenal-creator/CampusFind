import {
  AuditLog,
  Claim,
  HandoverEvent,
  Message,
  ReportItem,
  UserProfile,
  VerificationQuestion
} from '../types.ts';
import { DEMO_USERS, INITIAL_SEED_REPORTS } from '../constants/campus.ts';
import { isSupabaseConfigured, supabase } from './supabase.ts';

const STORAGE_KEYS = {
  REPORTS: 'campusfind_reports_v1',
  CLAIMS: 'campusfind_claims_v1',
  MESSAGES: 'campusfind_messages_v1',
  HANDOVERS: 'campusfind_handovers_v1',
  AUDIT_LOGS: 'campusfind_audit_logs_v1',
  CURRENT_USER: 'campusfind_current_user_v1',
  NOTIFICATIONS: 'campusfind_notifications_v1',
  ALLOWED_DOMAINS: 'campusfind_allowed_domains_v1'
};

class StorageEventEmitter extends EventTarget {
  notify(event: string) {
    this.dispatchEvent(new Event(event));
  }
}

export const storageEvents = new StorageEventEmitter();

// Initial seed claims
const INITIAL_SEED_CLAIMS: Claim[] = [
  {
    id: 'claim-101',
    report_id: 'rep-found-1',
    report_title: '14-inch Space Gray Laptop in Charcoal Wool Sleeve',
    report_type: 'found',
    claimant_id: 'user-maya',
    claimant_name: 'Maya Chen',
    claimant_email: 'maya.chen@university.edu',
    status: 'under_review',
    attempt_count: 1,
    answers: [
      {
        question_id: 'q-101',
        question_text: 'What distinctive sticker or mark is visible on the bottom edge or palm rest?',
        submitted_answer: 'Robotics Club circular gear badge sticker'
      },
      {
        question_id: 'q-102',
        question_text: 'What color or material is the zipper pull tab on the laptop sleeve?',
        submitted_answer: 'Tan / brown genuine leather strap pull'
      }
    ],
    created_at: '2026-10-18T17:15:00Z',
    updated_at: '2026-10-18T17:15:00Z'
  }
];

const INITIAL_SEED_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    claim_id: 'claim-101',
    sender_id: 'user-alex',
    sender_name: 'Alex Rivera',
    sender_role: 'student',
    content: 'Hi Maya! I reviewed your answers regarding the Robotics club sticker and tan leather pull tab. They match exactly. Happy to arrange safe return!',
    created_at: '2026-10-18T17:40:00Z',
    read: true
  },
  {
    id: 'msg-2',
    claim_id: 'claim-101',
    sender_id: 'user-maya',
    sender_name: 'Maya Chen',
    sender_role: 'student',
    content: 'Thank you so much Alex! You saved my semester midterm notes. Can we meet at the Main Library Circulation Desk tomorrow morning?',
    created_at: '2026-10-18T17:45:00Z',
    read: true
  }
];

const INITIAL_SEED_HANDOVERS: HandoverEvent[] = [
  {
    id: 'handover-1',
    claim_id: 'claim-101',
    report_id: 'rep-found-1',
    location_name: 'Main Circulation Desk (1st Floor) — University Main Library',
    meeting_time: '2026-10-21T10:30:00Z',
    notes: 'Meeting right in front of the front desk monitor. Attendant on duty.',
    finder_confirmed: true,
    claimant_confirmed: false,
    status: 'scheduled',
    created_at: '2026-10-18T18:00:00Z'
  }
];

const INITIAL_SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    actor_id: 'user-alex',
    actor_name: 'Alex Rivera',
    action: 'REPORT_CREATED',
    target_type: 'report',
    target_id: 'rep-found-1',
    details: { type: 'found', category: 'Electronics', title: '14-inch Space Gray Laptop' },
    created_at: '2026-10-18T14:30:00Z'
  },
  {
    id: 'log-2',
    actor_id: 'user-maya',
    actor_name: 'Maya Chen',
    action: 'CLAIM_SUBMITTED',
    target_type: 'claim',
    target_id: 'claim-101',
    details: { report_id: 'rep-found-1', attempt: 1 },
    created_at: '2026-10-18T17:15:00Z'
  },
  {
    id: 'log-3',
    actor_id: 'user-admin-daniels',
    actor_name: 'Officer Clara Daniels',
    action: 'SECURITY_VERIFICATION',
    target_type: 'system',
    target_id: 'audit-sec-01',
    details: { verification: 'Campus safe handover spot monitored' },
    created_at: '2026-10-19T08:00:00Z'
  }
];

export class StorageService {
  private static instance: StorageService;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
      StorageService.instance.initializeDefaults();
    }
    return StorageService.instance;
  }

  private initializeDefaults() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_SEED_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLAIMS)) {
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(INITIAL_SEED_CLAIMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_SEED_MESSAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HANDOVERS)) {
      localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(INITIAL_SEED_HANDOVERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_SEED_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALLOWED_DOMAINS)) {
      localStorage.setItem(STORAGE_KEYS.ALLOWED_DOMAINS, JSON.stringify(['.edu', '.ac.uk', '.edu.au', '.ca']));
    }
  }

  // --- Auth & User Management ---
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return null;
  }

  setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      this.addAuditLog(user.id, user.full_name, 'USER_SESSION_LOGIN', 'user', user.id, {
        role: user.role,
        email: user.email
      });
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    storageEvents.notify('user_changed');
  }

  getAllUsers(): UserProfile[] {
    return DEMO_USERS;
  }

  getAllowedDomains(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ALLOWED_DOMAINS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return ['.edu', '.ac.uk', '.edu.au', '.ca'];
  }

  setAllowedDomains(domains: string[]) {
    localStorage.setItem(STORAGE_KEYS.ALLOWED_DOMAINS, JSON.stringify(domains));
    const user = this.getCurrentUser();
    if (user) {
      this.addAuditLog(user.id, user.full_name, 'ALLOWED_DOMAINS_UPDATED', 'system', 'domains', {
        domains
      });
    }
    storageEvents.notify('domains_changed');
  }

  validateCampusEmail(email: string): { valid: boolean; reason?: string } {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      return { valid: false, reason: 'Please enter a valid email address with @' };
    }
    const domain = trimmed.split('@')[1];
    const allowed = this.getAllowedDomains();
    const isDomainAllowed = allowed.some((ext) => domain.endsWith(ext));
    if (!isDomainAllowed) {
      return {
        valid: false,
        reason: `Campus email must end with an approved domain (${allowed.join(', ')})`
      };
    }
    return { valid: true };
  }

  // --- Reports ---
  getReports(): ReportItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return INITIAL_SEED_REPORTS;
  }

  getReportById(id: string): ReportItem | undefined {
    return this.getReports().find((r) => r.id === id);
  }

  createReport(data: Omit<ReportItem, 'id' | 'created_at' | 'updated_at' | 'expires_at' | 'status'> & {
    verification_questions?: VerificationQuestion[];
  }): ReportItem {
    const reports = this.getReports();
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();

    const newReport: ReportItem = {
      ...data,
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'open',
      expires_at: expires,
      created_at: now,
      updated_at: now
    };

    reports.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    this.addAuditLog(
      data.user_id,
      data.user_name,
      'REPORT_CREATED',
      'report',
      newReport.id,
      { title: newReport.title, type: newReport.type, category: newReport.category }
    );

    storageEvents.notify('reports_changed');
    return newReport;
  }

  updateReport(id: string, updates: Partial<ReportItem>): ReportItem | null {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required: Please log in to edit reports.');
    }
    const existing = reports[index];

    // Authorization guard: must be creator or admin
    if (existing.user_id !== user.id && user.role !== 'admin') {
      throw new Error('Unauthorized: Only the report creator or a campus administrator may edit this report.');
    }

    const updated: ReportItem = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    reports[index] = updated;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    this.addAuditLog(
      user.id,
      user.full_name,
      'REPORT_UPDATED',
      'report',
      id,
      updates
    );

    storageEvents.notify('reports_changed');
    return updated;
  }

  deleteReport(id: string): boolean {
    const reports = this.getReports();
    const existing = reports.find((r) => r.id === id);
    if (!existing) return false;

    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required: Please log in to delete reports.');
    }
    if (existing.user_id !== user.id && user.role !== 'admin') {
      throw new Error('Unauthorized: Only the report creator or an admin can delete this report.');
    }

    const filtered = reports.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));

    this.addAuditLog(
      user.id,
      user.full_name,
      'REPORT_DELETED',
      'report',
      id,
      { title: existing.title }
    );

    storageEvents.notify('reports_changed');
    return true;
  }

  flagReport(id: string, reason: string): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required: Please log in to flag reports.');
    }
    return Boolean(this.updateReport(id, {
      is_flagged: true,
      flag_reason: reason
    }));
  }

  unflagReport(id: string): boolean {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can clear flags.');
    }
    return Boolean(this.updateReport(id, {
      is_flagged: false,
      flag_reason: undefined
    }));
  }

  // --- Claims & Verification ---
  getClaims(): Claim[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CLAIMS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return INITIAL_SEED_CLAIMS;
  }

  getClaimsForReport(reportId: string): Claim[] {
    return this.getClaims().filter((c) => c.report_id === reportId);
  }

  getClaimsForUser(userId: string): Claim[] {
    return this.getClaims().filter((c) => c.claimant_id === userId);
  }

  submitClaim(
    reportId: string,
    answers: { question_id: string; question_text: string; submitted_answer: string }[]
  ): Claim {
    const user = this.getCurrentUser();
    const report = this.getReportById(reportId);
    if (!report) throw new Error('Report not found');

    if (report.user_id === user.id) {
      throw new Error('You cannot claim an item you reported yourself.');
    }

    const claims = this.getClaims();
    const existingClaim = claims.find(
      (c) => c.report_id === reportId && c.claimant_id === user.id
    );

    if (existingClaim) {
      if (existingClaim.status === 'rejected') {
        if (existingClaim.attempt_count >= 3) {
          throw new Error('Verification limit reached. You have exceeded maximum verification attempts for this item.');
        }
        // Update existing claim with incremented attempt
        existingClaim.attempt_count += 1;
        existingClaim.answers = answers;
        existingClaim.status = 'under_review';
        existingClaim.updated_at = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));

        this.addAuditLog(user.id, user.full_name, 'CLAIM_RESUBMITTED', 'claim', existingClaim.id, {
          attempt: existingClaim.attempt_count
        });

        storageEvents.notify('claims_changed');
        return existingClaim;
      } else {
        throw new Error(`An active claim is already ${existingClaim.status} for this item.`);
      }
    }

    const newClaim: Claim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      report_id: reportId,
      report_title: report.title,
      report_type: report.type,
      claimant_id: user.id,
      claimant_name: user.full_name,
      claimant_email: user.email,
      status: 'under_review',
      attempt_count: 1,
      answers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    claims.push(newClaim);
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));

    // Update report status to claim_pending
    this.updateReport(reportId, { status: 'claim_pending' });

    this.addAuditLog(user.id, user.full_name, 'CLAIM_SUBMITTED', 'claim', newClaim.id, {
      report_id: reportId,
      report_title: report.title
    });

    storageEvents.notify('claims_changed');
    return newClaim;
  }

  updateClaimStatus(
    claimId: string,
    status: Claim['status'],
    rejectionReason?: string
  ): Claim {
    const claims = this.getClaims();
    const index = claims.findIndex((c) => c.id === claimId);
    if (index === -1) throw new Error('Claim not found');

    const claim = claims[index];
    const report = this.getReportById(claim.report_id);
    const user = this.getCurrentUser();

    // Must be report finder or admin
    if (report && report.user_id !== user.id && user.role !== 'admin') {
      throw new Error('Unauthorized: Only the item finder or campus admin may approve or reject claims.');
    }

    claim.status = status;
    if (rejectionReason) claim.rejection_reason = rejectionReason;
    claim.updated_at = new Date().toISOString();

    claims[index] = claim;
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));

    // If claim approved, open private chat notification
    if (status === 'approved') {
      this.sendMessage(
        claimId,
        `System: Claim has been approved by ${user.full_name}. You may now communicate privately to coordinate safe item return.`
      );
    } else if (status === 'rejected') {
      // If rejected and no other pending claims, set report back to open
      const otherPending = claims.some(
        (c) => c.report_id === claim.report_id && c.id !== claimId && c.status === 'under_review'
      );
      if (!otherPending && report) {
        this.updateReport(report.id, { status: 'open' });
      }
    } else if (status === 'returned') {
      if (report) {
        this.updateReport(report.id, { status: 'returned' });
      }
    }

    this.addAuditLog(user.id, user.full_name, `CLAIM_STATUS_${status.toUpperCase()}`, 'claim', claimId, {
      status,
      rejection_reason: rejectionReason
    });

    storageEvents.notify('claims_changed');
    return claim;
  }

  // --- Messaging ---
  getMessages(claimId: string): Message[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (raw) {
        const all: Message[] = JSON.parse(raw);
        return all.filter((m) => m.claim_id === claimId);
      }
    } catch {
      // fallback
    }
    return [];
  }

  sendMessage(claimId: string, content: string): Message {
    const user = this.getCurrentUser();
    const claims = this.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found');

    const report = this.getReportById(claim.report_id);
    // Check authorization: must be claimant, finder, or admin
    const isAuthorized =
      claim.claimant_id === user.id ||
      (report && report.user_id === user.id) ||
      user.role === 'admin';

    if (!isAuthorized) {
      throw new Error('Unauthorized to post messages to this claim conversation.');
    }

    let all: Message[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (raw) all = JSON.parse(raw);
    } catch {
      all = [];
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      claim_id: claimId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      content: content.trim(),
      created_at: new Date().toISOString(),
      read: false
    };

    all.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    storageEvents.notify('messages_changed');
    return newMsg;
  }

  // --- Safe Handover ---
  getHandovers(): HandoverEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return INITIAL_SEED_HANDOVERS;
  }

  getHandoverForClaim(claimId: string): HandoverEvent | undefined {
    return this.getHandovers().find((h) => h.claim_id === claimId);
  }

  scheduleHandover(
    claimId: string,
    locationName: string,
    meetingTime: string,
    notes?: string
  ): HandoverEvent {
    const user = this.getCurrentUser();
    const claim = this.getClaims().find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found');

    const handovers = this.getHandovers();
    const existingIndex = handovers.findIndex((h) => h.claim_id === claimId);

    const isFinder = this.getReportById(claim.report_id)?.user_id === user.id;
    const isClaimant = claim.claimant_id === user.id;

    const event: HandoverEvent = {
      id: existingIndex >= 0 ? handovers[existingIndex].id : `handover-${Date.now()}`,
      claim_id: claimId,
      report_id: claim.report_id,
      location_name: locationName,
      meeting_time: meetingTime,
      notes,
      finder_confirmed: isFinder,
      claimant_confirmed: isClaimant,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      handovers[existingIndex] = event;
    } else {
      handovers.push(event);
    }

    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(handovers));

    this.sendMessage(
      claimId,
      `Safe Handover Scheduled at ${locationName} for ${new Date(meetingTime).toLocaleString()}. Please confirm attendance.`
    );

    this.addAuditLog(user.id, user.full_name, 'HANDOVER_SCHEDULED', 'handover', event.id, {
      location: locationName,
      meeting_time: meetingTime
    });

    storageEvents.notify('handovers_changed');
    return event;
  }

  confirmHandover(claimId: string): HandoverEvent {
    const user = this.getCurrentUser();
    const claim = this.getClaims().find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found');

    const handovers = this.getHandovers();
    const index = handovers.findIndex((h) => h.claim_id === claimId);
    if (index === -1) throw new Error('No handover scheduled for this claim.');

    const handover = handovers[index];
    const report = this.getReportById(claim.report_id);

    const isFinder = report?.user_id === user.id;
    const isClaimant = claim.claimant_id === user.id;
    const isAdmin = user.role === 'admin';

    if (isFinder || isAdmin) handover.finder_confirmed = true;
    if (isClaimant || isAdmin) handover.claimant_confirmed = true;

    // Both parties confirmed or admin override completes the handover
    if ((handover.finder_confirmed && handover.claimant_confirmed) || isAdmin) {
      handover.status = 'completed';
      handover.completed_at = new Date().toISOString();

      // Mark claim returned
      this.updateClaimStatus(claimId, 'returned');
      this.sendMessage(
        claimId,
        `Safe Handover Confirmed! Item successfully returned to its rightful owner. Thank you for protecting campus integrity.`
      );
    }

    handovers[index] = handover;
    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(handovers));

    this.addAuditLog(user.id, user.full_name, 'HANDOVER_CONFIRMED', 'handover', handover.id, {
      status: handover.status
    });

    storageEvents.notify('handovers_changed');
    return handover;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return INITIAL_SEED_AUDIT_LOGS;
  }

  addAuditLog(
    actorId: string,
    actorName: string,
    action: string,
    targetType: AuditLog['target_type'],
    targetId: string,
    details: Record<string, unknown>
  ): AuditLog {
    let logs: AuditLog[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (raw) logs = JSON.parse(raw);
    } catch {
      logs = [];
    }

    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor_id: actorId,
      actor_name: actorName,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString()
    };

    logs.unshift(log);
    // keep max 200 logs
    if (logs.length > 200) logs = logs.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    storageEvents.notify('audit_changed');
    return log;
  }

  // --- Privacy & GDPR / Account Erasure ---
  deleteUserData(userId: string): { success: boolean; deletedReports: number; deletedClaims: number } {
    const reports = this.getReports();
    const userReports = reports.filter((r) => r.user_id === userId);
    const remainingReports = reports.filter((r) => r.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(remainingReports));

    const claims = this.getClaims();
    const userClaims = claims.filter((c) => c.claimant_id === userId);
    const remainingClaims = claims.filter((c) => c.claimant_id !== userId);
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(remainingClaims));

    const user = this.getCurrentUser();
    this.addAuditLog(
      user.id,
      user.full_name,
      'USER_DATA_ERASURE_REQUEST',
      'user',
      userId,
      {
        deletedReportsCount: userReports.length,
        deletedClaimsCount: userClaims.length,
        privacyStandard: 'FERPA / GDPR Right to Erasure'
      }
    );

    storageEvents.notify('reports_changed');
    storageEvents.notify('claims_changed');

    return {
      success: true,
      deletedReports: userReports.length,
      deletedClaims: userClaims.length
    };
  }

  resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_SEED_REPORTS));
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(INITIAL_SEED_CLAIMS));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_SEED_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(INITIAL_SEED_HANDOVERS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_SEED_AUDIT_LOGS));
    storageEvents.notify('reports_changed');
    storageEvents.notify('claims_changed');
    storageEvents.notify('messages_changed');
    storageEvents.notify('handovers_changed');
    storageEvents.notify('user_changed');
  }
}

export const storage = StorageService.getInstance();
