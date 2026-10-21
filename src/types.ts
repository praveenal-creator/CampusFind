export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  campus_domain: string;
  avatar_url?: string;
  student_id?: string;
  created_at: string;
}

export type ReportType = 'lost' | 'found';

export type ItemCategory =
  | 'Electronics'
  | 'IDs & Badges'
  | 'Keys'
  | 'Bags & Wallets'
  | 'Audio & Headphones'
  | 'Bottles & Tumblers'
  | 'Clothing & Accessories'
  | 'Books & Notebooks'
  | 'Eyewear'
  | 'Other';

export type ReportStatus = 'open' | 'claim_pending' | 'returned' | 'expired' | 'archived';

export interface VerificationQuestion {
  id: string;
  report_id: string;
  question: string;
  hint?: string;
  expected_answer?: string; // Kept private, only accessible to finder / server
}

export interface ReportItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: ReportType;
  category: ItemCategory;
  title: string;
  description: string;
  primary_color: string;
  secondary_color?: string;
  brand?: string;
  location_zone: string;
  location_detail: string;
  date_occurred: string;
  image_url?: string;
  status: ReportStatus;
  verification_questions?: VerificationQuestion[];
  is_flagged?: boolean;
  flag_reason?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type ClaimStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'returned';

export interface ClaimAnswer {
  question_id: string;
  question_text: string;
  submitted_answer: string;
}

export interface Claim {
  id: string;
  report_id: string;
  report_title: string;
  report_type: ReportType;
  claimant_id: string;
  claimant_name: string;
  claimant_email: string;
  status: ClaimStatus;
  attempt_count: number;
  answers: ClaimAnswer[];
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  claim_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  created_at: string;
  read: boolean;
}

export interface HandoverEvent {
  id: string;
  claim_id: string;
  report_id: string;
  location_name: string;
  meeting_time: string;
  notes?: string;
  finder_confirmed: boolean;
  claimant_confirmed: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  completed_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: 'report' | 'claim' | 'user' | 'handover' | 'system';
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface MatchFactor {
  factor: 'Category' | 'Brand' | 'Color' | 'Location' | 'Date Proximity' | 'Keywords';
  weight: number;
  score: number;
  contribution: number;
  explanation: string;
}

export interface MatchResult {
  target_report: ReportItem;
  candidate_report: ReportItem;
  total_score: number;
  factors: MatchFactor[];
}

export interface CampusZone {
  id: string;
  name: string;
  description: string;
  safe_handover_spots: string[];
}
