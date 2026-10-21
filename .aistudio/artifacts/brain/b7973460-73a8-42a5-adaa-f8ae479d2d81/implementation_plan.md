# CampusFind — Collegiate Lost & Found Network

CampusFind is a secure, privacy-first lost-and-found platform for colleges and universities. It replaces scattered social media posts and paper logs with structured reporting, explainable multi-factor item matching, two-step challenge-question verification, private in-app claim coordination, and designated campus handover points.

***

### User Review & Critical Decisions

> [!IMPORTANT]
> The following product specifications were confirmed during interactive requirements clarification:
> - **Dual Storage Mode**: Interactive demo mode with persistent local storage and live Supabase connector dialog, complete with production-ready PostgreSQL schema migrations and Row Level Security (RLS) rules.
> - **Campus Directory Structure**: Universal collegiate directory with customizable campus zones (Libraries, Student Union, Athletic Complex, Academic Halls, Dining) and specific pick-up locations.
> - **Verification Workflow**: Two-step challenge questions configured by the finder (answers kept secret on the server) with finder/admin review and rate-limiting before private chat unlocks.

***

## 1. Overview & Core Concept

- **What It Does**: Enables students and staff to file Lost and Found reports with rich metadata and secure photo uploads; computes explainable match scores between open reports; enforces safe ownership claims via secret challenge questions; provides private messaging and safe handover scheduling at verified campus locations; and equips campus administrators with a full moderation console and audit logs.
- **Target Audience**: University students, faculty, lost-and-found desk attendants, campus police/security officers, and system administrators.
- **Key Value**: Prevents false claims and theft through hidden verification details, eliminates repetitive manual matching, protects student privacy (no public phone numbers or emails), and tracks items cleanly from report to safe physical return.

***

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Create Report  │──────▶│ Explainable     │──────▶│ 2-Step Challenge │
│  (Lost / Found) │       │ Match Discovery │       │ Verification     │
└─────────────────┘       └─────────────────┘       └──────────────────┘
                                                              │
                                                              ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Item Returned  │◀──────│  Safe Handover  │◀──────│ Private Claim    │
│  & Audit Log    │       │  Coordination   │       │ Chat (Unlocked)  │
└─────────────────┘       └─────────────────┘       └──────────────────┘
```

1. **Discovery & Exploration**:
   - Filterable catalog of Lost vs. Found items with category tabs (Electronics, IDs & Cards, Keys, Bags & Wallets, Clothing, Books, Other).
   - High-contrast search bar with campus location filtering, date-range filters, and status badges (`Open`, `Claim Pending`, `Returned`).
   - Clean card grid with real item photography, consistent aspect ratios, and unboxed metadata lines.

2. **Report Submission**:
   - Distinctive mode selection: **I Lost Something** vs. **I Found Something**.
   - Input validation: Title, category, primary & secondary colors, brand, approximate date, campus zone + specific room/area.
   - Secure image uploader (supports drag-and-drop, client-side MIME/size validation, and thumbnail preview).
   - **Found Item Privacy Guard**: The finder configures 1–3 hidden ownership questions (e.g., "What is the lockscreen photo?", "What sticker is on the back?", "What is written inside?"). Sensitive details are hidden from public view.
   - Duplicate warning check against existing campus reports before submission.

3. **Deterministic Match Engine**:
   - Direct side-by-side comparison between Lost and Found reports.
   - Explainable match breakdown: Category match (30%), Brand match (20%), Color match (15%), Campus Location proximity (15%), Date proximity (10%), Title/description keyword similarity (10%).
   - Visible reasoning explaining why an item was suggested (e.g., *"+30% Exact Category Match, +20% Brand (Apple), +15% Location (Main Library)"*).

4. **Claim Verification & Access Control**:
   - Claimant enters answers to the finder's challenge questions.
   - Maximum 3 verification attempts per user per item to prevent brute-force guessing.
   - Finder or administrator reviews submitted answers without exposing correct answers in the client bundle.
   - Status transitions: `Submitted` → `Under Review` → `Approved` / `Rejected` → `Returned`.

5. **Private Claim Messaging & Safe Handover**:
   - Unlocked exclusively once a claim is approved by the finder or admin.
   - Claim-specific real-time chat with message timestamps and unread counters.
   - Safe Handover Scheduler: Select verified campus spots (e.g., Student Union Info Desk, Campus Police Station, Library Front Desk) and agreed time window.
   - Dual-confirmation or admin completion to mark item `Returned`.

6. **Administrator Console**:
   - Live campus metrics calculated from database records (Total active reports, recovery rate %, average return time, pending claims).
   - Report moderation: Flag, edit, expire, or remove suspicious reports.
   - Claim dispute resolution and user account management with configurable student email domains (`.edu`, `.ac.uk`, etc.).
   - Immutable audit log tracking all moderation actions, claim approvals, and status transitions.

7. **Supabase Connector & Migration Console**:
   - Live indicator displaying connection status (Demo LocalStorage Mode vs. Live Supabase).
   - In-app modal with copy-ready SQL schema, RLS policies, seed data, and `.env` configuration instructions.

### Visual Identity & Theme
- **Color Palette (60-30-10 Rule)**:
  - Dominant Neutral (60%): Warm off-white canvas (`#FBFBFA`) and soft surface cards (`#FFFFFF`).
  - Structural Contrast (30%): Deep collegiate navy (`#0F1E36`) headers and primary text, stone hairline borders (`#E2E8F0`).
  - High-Intent Accent (10%): Warm collegiate teal (`#0D9488` / `#14B8A6`) for primary CTAs, active filters, and match highlights; subtle amber (`#D97706`) for pending reviews; emerald (`#16A34A`) for verified returns.
- **Typography**:
  - Headings: `Plus Jakarta Sans` (bold, tracking-tight, balanced headlines).
  - Body: `Public Sans` / `DM Sans` (14px–15px, generous 1.6 line height).
  - Telemetry & Data: `font-mono tabular-nums` for dates, match scores, reference IDs, and verification counts.
- **Anti-Slop Discipline**:
  - No static pill badges or floating candy chips for metadata; clean unboxed text separated by `·` bullet dividers.
  - No code-comment prefixes (`//`), no fake latency counters, no decorative status dots.
  - Zero broken images: Resilient fallback containers with category iconography and title overlay.
- **Layout Architecture**:
  - Desktop: 260px fixed sidebar with collegiate wordmark, navigation links, quick report CTA, and user role switcher.
  - Mobile: Clean sticky top header with responsive slide-out drawer navigation and bottom quick-action bar.

***

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Why | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Matching Algorithm** | Deterministic token-based weighted score (Category, Brand, Color, Location, Date, Title/Description tokens). | 100% free-tier compatible, predictable, instantaneous, fully explainable to students without hallucinations or external API costs. | Paid vector embeddings or LLM calls (rejected due to API quotas, cost, and opaque scoring). |
| **Verification Security** | Server-side validated challenge questions with hidden answers and 3-attempt lockouts. | Stops false claimants from seeing answers in API responses or inspecting browser network tabs. | Public contact info (causes spam/harassment) or honour-system claims (causes theft). |
| **Storage Architecture** | Dual-mode repository pattern: Supabase client with PostgreSQL RLS + LocalStorage fallback engine sharing identical interfaces. | Works out-of-the-box in AI Studio sandbox while providing production-ready SQL migrations and instant live Supabase connectivity. | Requiring live Supabase keys to boot (would crash or block users without keys) or mock-only code (not production ready). |
| **Handover Safety** | Preset verified public campus safe-zones with dual confirmation. | Protects student safety by discouraging dorm room or isolated off-campus pickups. | Unmoderated meetups or arbitrary address entry. |

***

## 4. Technical Architecture & Data Strategy

### System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CampusFind React App                          │
├────────────────────────────────────────────────────────────────────────┤
│  Views:                                                                │
│  ├── Catalog & Search (Lost & Found)                                   │
│  ├── Report Wizard (Photo Upload, Privacy Guard)                       │
│  ├── Match Explorer (Explainable Deterministic Scoring)                │
│  ├── Claim Verification & Approval Portal                              │
│  ├── Private In-App Messaging & Handover Scheduler                     │
│  └── Admin Console (Moderation, Users, Audit Logs, Analytics)          │
├────────────────────────────────────────────────────────────────────────┤
│  State & Service Layer:                                                │
│  ├── AuthContext (Role-based access: Student vs. Admin, Domain verify) │
│  ├── DatabaseService (Abstract Data Access Layer)                      │
│  │     ├── SupabaseProvider (PostgreSQL, Storage, Realtime)            │
│  │     └── LocalStorageProvider (Reactive Fallback with Seed Data)     │
│  ├── MatchEngineService (Weighted explainable matching)                │
│  └── NotificationService (Status triggers, claim alerts)               │
├────────────────────────────────────────────────────────────────────────┤
│  Database & Security (Supabase PostgreSQL / RLS):                     │
│  ├── tables: profiles, reports, verification_questions, claims,        │
│  │          claim_answers, messages, handover_events, audit_logs       │
│  └── policies: RLS row isolation, hidden verification column security  │
└────────────────────────────────────────────────────────────────────────┘
```

### PostgreSQL Data Schema & RLS Policies

1. **`profiles`**: `id` (UUID, PK), `email` (TEXT), `full_name` (TEXT), `role` (`student` | `admin`), `avatar_url` (TEXT), `campus_domain` (TEXT), `created_at` (TIMESTAMPTZ).
2. **`reports`**: `id` (UUID, PK), `user_id` (FK profiles), `type` (`lost` | `found`), `category` (TEXT), `title` (TEXT), `description` (TEXT), `color` (TEXT), `brand` (TEXT), `location_zone` (TEXT), `location_detail` (TEXT), `date_occurred` (DATE), `image_url` (TEXT), `status` (`open` | `claim_pending` | `returned` | `expired`), `expires_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ).
3. **`verification_questions`**: `id` (UUID, PK), `report_id` (FK reports), `question` (TEXT), `hashed_answer` (TEXT, private), `answer_hint` (TEXT), `created_at` (TIMESTAMPTZ). *RLS strictly restricts `hashed_answer` to the report owner and administrators.*
4. **`claims`**: `id` (UUID, PK), `report_id` (FK reports), `claimant_id` (FK profiles), `status` (`submitted` | `under_review` | `approved` | `rejected` | `cancelled` | `returned`), `attempts_count` (INT), `rejection_reason` (TEXT), `created_at` (TIMESTAMPTZ).
5. **`claim_answers`**: `id` (UUID, PK), `claim_id` (FK claims), `question_id` (FK verification_questions), `submitted_answer` (TEXT), `is_correct` (BOOLEAN).
6. **`messages`**: `id` (UUID, PK), `claim_id` (FK claims), `sender_id` (FK profiles), `content` (TEXT), `read_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ). *RLS strictly permits only the finder, the claimant, and admins.*
7. **`handover_events`**: `id` (UUID, PK), `claim_id` (FK claims), `location_name` (TEXT), `scheduled_time` (TIMESTAMPTZ), `finder_confirmed` (BOOLEAN), `claimant_confirmed` (BOOLEAN), `completed_at` (TIMESTAMPTZ).
8. **`audit_logs`**: `id` (UUID, PK), `actor_id` (FK profiles), `action` (TEXT), `target_type` (TEXT), `target_id` (UUID), `details` (JSONB), `created_at` (TIMESTAMPTZ).

***

## 5. Implementation Roadmap & Verification

1. **Phase 1: Project Setup & Types**:
   - Configure dependencies (`@supabase/supabase-js`, icons, animation utilities).
   - Set up TypeScript models (`types.ts`), campus location catalog, and mock seed data.
   - Create Supabase SQL migration script file (`supabase/schema.sql`) including all tables, indexes, and comprehensive RLS policies.
2. **Phase 2: Data Repositories & Matching Engine**:
   - Implement storage repository pattern supporting both Supabase and reactive localStorage.
   - Build deterministic multi-factor match engine (`matchEngine.ts`) with explainable percentage calculation and contributing factors.
   - Create image upload handler with client-side mime/size guard and Base64/Storage integration.
3. **Phase 3: Core UI & Navigation**:
   - Build responsive layout with 3-zone top bar, desktop sidebar, and mobile drawer.
   - Create Lost & Found catalog with live search, filters, category tabs, and zero-pill metadata.
   - Build Lost & Found report creation modal with privacy guard and verification question setup.
4. **Phase 4: Claim Verification & Chat**:
   - Implement two-step challenge verification modal with rate-limiting and finder review view.
   - Build private messaging drawer for approved claims.
   - Create Safe Handover coordinator with verified campus meeting spots.
5. **Phase 5: Admin Console & Supabase Config Dialog**:
   - Implement administrative moderation panel (claim review, report management, audit logs, and real database analytics).
   - Add Supabase connection status indicator with copyable SQL migrations and `.env` setup guide.
   - Implement privacy notice and GDPR account/data deletion flow.
6. **Phase 6: Build Verification & Testing**:
   - Run `compile_applet` and type-checking.
   - Verify report creation, matching score explanations, claim workflow, admin moderation, and theme consistency.
