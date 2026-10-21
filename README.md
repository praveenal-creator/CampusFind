# CampusFind — Collegiate Lost & Found Network

CampusFind is a premium, privacy-first collegiate lost-and-found web application built for universities, colleges, and campus communities.

***

## Key Capabilities

1. **Authentication & Multi-Persona Roles**:
   - Database-backed authorization for **Students** and **Campus Security/Administrators**.
   - Configurable student email domain whitelist (e.g. `.edu`, `.ac.uk`, `.ca`).
   - One-click persona switcher for interactive testing between students (Maya Chen, Alex Rivera) and campus police (Officer Clara Daniels).
2. **Lost & Found Reporting**:
   - File Lost and Found items with category, title, description, colors, brand, date, and campus zone.
   - Secure photo upload with client-side MIME and size validation (< 5MB) and instant preview.
   - Realtime duplicate-report warning guard before submission.
3. **Explainable Deterministic Smart Matching**:
   - 100% free-tier compatible, zero paid AI APIs.
   - Mathematical multi-factor weighted algorithm: Category (30%), Brand (20%), Color (15%), Location zone (15%), Date proximity (10%), and text token similarity (10%).
   - Transparent explanations detailing every contributing factor percentage.
4. **Two-Step Challenge Verification (Privacy Guard)**:
   - Found item reporters set secret ownership challenge questions (e.g., sticker markings, inner engravings, lockscreen wallpaper).
   - Expected answers are kept strictly private on the server/database.
   - 3-attempt rate limiter to stop brute-force guessing and false claims.
   - Side-by-side finder & administrator review portal.
5. **Private In-App Messaging & Safe Handover**:
   - Private claim chat unlocked strictly once a claim is verified and approved.
   - Designated staffed campus handover spots (Library Front Desk, Police Dispatch Window, Student Union Info Counter).
   - Dual-confirmation protocol to record returns into the permanent campus audit log.
6. **Administrator Console**:
   - Live metrics calculated from actual database records (Total active reports, recovery rate %, pending claims).
   - Report moderation (flagging suspicious posts, expiration, removal).
   - Whitelist management for permitted campus email domains.
   - Immutable security audit log.
7. **Privacy & Data Governance**:
   - Zero public telephone numbers or personal emails.
   - Full FERPA compliance and GDPR "Right to Erasure" account/data deletion flow.

***

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database / Backend**: Supabase (PostgreSQL, Storage, Row Level Security)
- **Local Fallback**: Reactive persistent repository with real-time event synchronization when running without Supabase credentials.

***

## Local Development & Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/campusfind.git
cd campusfind
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your Supabase credentials (optional for interactive demo mode, required for live multi-device production):

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
VITE_ALLOWED_CAMPUS_DOMAINS=".edu,.ac.uk,.edu.au,.ca"
```

### 3. Database Setup (Supabase PostgreSQL)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase Dashboard, open the **SQL Editor**.
3. Open `supabase/schema.sql` from this repository and run the entire script.
4. This script automatically creates:
   - Tables: `profiles`, `reports`, `verification_questions`, `claims`, `messages`, `handovers`, `audit_logs`.
   - Foreign keys, constraints, and performance indexes.
   - Row Level Security (RLS) policies enforcing user isolation and protecting secret verification answers.

### 4. Run the Development Server

```bash
npm run dev
```

The application will be live at `http://localhost:3000`.

***

## Production Deployment to Cloudflare Pages & GitHub

CampusFind builds into a static SPA with Supabase handling database, authentication, and file storage.

### Free Deployment Steps:

1. Push your repository to GitHub.
2. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your GitHub repository.
4. Configure Build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ALLOWED_CAMPUS_DOMAINS`
6. Click **Save and Deploy**. Cloudflare Pages will build and deploy your app globally with zero cost and high performance.

***

## Security & Row Level Security (RLS) Guarantees

- **Profiles**: Authenticated campus students can view basic public user names; only the owner can modify their profile.
- **Reports**: Any authenticated campus member can view open lost/found items. Modifying or deleting a report is restricted to the original author or a user with `role = 'admin'`.
- **Verification Answers**: Expected challenge answers (`expected_answer_hash`) are isolated so that API queries by claimants only return the question text and hint—never the expected secret answer.
- **Messaging**: Conversations are restricted strictly to the item finder, the verified claimant, and administrators.
