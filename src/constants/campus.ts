import { CampusZone, ItemCategory, UserProfile } from '../types.ts';

export const CAMPUS_ZONES: CampusZone[] = [
  {
    id: 'zone-library',
    name: 'University Main Library',
    description: 'Central library, quiet study floors, stacks, and computer commons',
    safe_handover_spots: [
      'Main Circulation Desk (1st Floor)',
      'Library Security Station (Entrance)',
      'Research Help Desk (2nd Floor)'
    ]
  },
  {
    id: 'zone-union',
    name: 'Student Union & Commons',
    description: 'Food court, student lounge, club rooms, and campus bookstore',
    safe_handover_spots: [
      'Student Union Info Desk (Ground Floor)',
      'Campus Bookstore Cashier Desk',
      'Dining Hall Service Manager Desk'
    ]
  },
  {
    id: 'zone-stem',
    name: 'Science & Engineering Quad',
    description: 'Lecture halls, computer labs, maker spaces, and engineering offices',
    safe_handover_spots: [
      'STEM Complex Reception Desk',
      'Computer Science Hall Lobby',
      'Engineering Dean Office Front Counter'
    ]
  },
  {
    id: 'zone-athletics',
    name: 'Recreation & Athletic Center',
    description: 'Gymnasium, Olympic pool, indoor courts, and locker rooms',
    safe_handover_spots: [
      'Fitness Center Check-in Counter',
      'Athletic Facility Manager Office',
      'Intramural Sports Desk'
    ]
  },
  {
    id: 'zone-dorms',
    name: 'Residential Village & Dorms',
    description: 'Undergraduate dormitories, courtyard, dining halls, and laundry rooms',
    safe_handover_spots: [
      'Central Housing Front Desk (Open 24/7)',
      'Community Center Security Post',
      'Mail & Package Center Counter'
    ]
  },
  {
    id: 'zone-police',
    name: 'Campus Public Safety & Police HQ',
    description: 'Official university police department and emergency services',
    safe_handover_spots: [
      'Campus Police Dispatch Window (24/7 Secure)',
      'Lost & Found Central Vault Office'
    ]
  }
];

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Electronics',
  'IDs & Badges',
  'Keys',
  'Bags & Wallets',
  'Audio & Headphones',
  'Bottles & Tumblers',
  'Clothing & Accessories',
  'Books & Notebooks',
  'Eyewear',
  'Other'
];

export const COMMON_COLORS = [
  'Black',
  'Space Gray',
  'Silver',
  'Navy Blue',
  'Teal / Cyan',
  'Forest Green',
  'Red / Crimson',
  'Brown / Tan',
  'White',
  'Yellow / Gold',
  'Purple'
];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-maya',
    email: 'maya.chen@university.edu',
    full_name: 'Maya Chen',
    role: 'student',
    campus_domain: 'university.edu',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    student_id: 'STU-2024-8841',
    created_at: '2026-08-15T10:00:00Z'
  },
  {
    id: 'user-alex',
    email: 'alex.rivera@university.edu',
    full_name: 'Alex Rivera',
    role: 'student',
    campus_domain: 'university.edu',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    student_id: 'STU-2024-9122',
    created_at: '2026-08-20T11:30:00Z'
  },
  {
    id: 'user-admin-daniels',
    email: 'c.daniels@university.edu',
    full_name: 'Officer Clara Daniels',
    role: 'admin',
    campus_domain: 'university.edu',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    student_id: 'STAFF-SEC-042',
    created_at: '2026-01-10T08:00:00Z'
  }
];

export const INITIAL_SEED_REPORTS = [
  {
    id: 'rep-found-1',
    user_id: 'user-alex',
    user_name: 'Alex Rivera',
    user_email: 'alex.rivera@university.edu',
    type: 'found' as const,
    category: 'Electronics' as const,
    title: '14-inch Space Gray Laptop in Charcoal Wool Sleeve',
    description: 'Found unattended on a quiet desk in the 3rd-floor stacks near economics bookshelves. Left with a felt zippered sleeve.',
    primary_color: 'Space Gray',
    secondary_color: 'Black',
    brand: 'Apple',
    location_zone: 'University Main Library',
    location_detail: '3rd Floor Study Stacks, Desk #14 near south window',
    date_occurred: '2026-10-18',
    image_url: '/src/assets/images/laptop_in_sleeve_1792514856913.jpg',
    status: 'open' as const,
    verification_questions: [
      {
        id: 'q-101',
        report_id: 'rep-found-1',
        question: 'What distinctive sticker or mark is visible on the bottom edge or palm rest?',
        hint: 'Mention any campus club, tech brand, or design logo.',
        expected_answer: 'Robotics Club gear sticker'
      },
      {
        id: 'q-102',
        report_id: 'rep-found-1',
        question: 'What color or material is the zipper pull tab on the laptop sleeve?',
        hint: 'Specific shade or leather accent.',
        expected_answer: 'Tan leather pull tab'
      }
    ],
    expires_at: '2026-12-02T10:00:00Z',
    created_at: '2026-10-18T14:30:00Z',
    updated_at: '2026-10-18T14:30:00Z'
  },
  {
    id: 'rep-lost-1',
    user_id: 'user-maya',
    user_name: 'Maya Chen',
    user_email: 'maya.chen@university.edu',
    type: 'lost' as const,
    category: 'Electronics' as const,
    title: 'MacBook Pro 14" with Dark Wool Incase Sleeve',
    description: 'Lost my space gray MacBook Pro while studying for midterm exams on Sunday afternoon. It was inside a charcoal felt sleeve with tan leather accents.',
    primary_color: 'Space Gray',
    secondary_color: 'Charcoal',
    brand: 'Apple',
    location_zone: 'University Main Library',
    location_detail: 'Upper floors quiet desks near window bays',
    date_occurred: '2026-10-18',
    image_url: '/src/assets/images/laptop_in_sleeve_1792514856913.jpg',
    status: 'open' as const,
    expires_at: '2026-12-02T16:00:00Z',
    created_at: '2026-10-18T16:20:00Z',
    updated_at: '2026-10-18T16:20:00Z'
  },
  {
    id: 'rep-found-2',
    user_id: 'user-maya',
    user_name: 'Maya Chen',
    user_email: 'maya.chen@university.edu',
    type: 'found' as const,
    category: 'Bottles & Tumblers' as const,
    title: 'Teal Hydro Flask 32oz Insulated Bottle',
    description: 'Discovered sitting on the stone courtyard bench right outside Columbia Hall entrance after lunchtime lectures.',
    primary_color: 'Teal / Cyan',
    secondary_color: 'Black',
    brand: 'Hydro Flask',
    location_zone: 'Student Union & Commons',
    location_detail: 'Courtyard Stone Bench near South Entrance',
    date_occurred: '2026-10-19',
    image_url: '/src/assets/images/metal_water_bottle_1792514857257.jpg',
    status: 'open' as const,
    verification_questions: [
      {
        id: 'q-201',
        report_id: 'rep-found-2',
        question: 'What specific lid style or handle does this Hydro Flask have?',
        hint: 'Standard wide loop or straw cap?',
        expected_answer: 'Wide mouth black flex cap with handle'
      }
    ],
    expires_at: '2026-12-03T12:00:00Z',
    created_at: '2026-10-19T13:10:00Z',
    updated_at: '2026-10-19T13:10:00Z'
  },
  {
    id: 'rep-found-3',
    user_id: 'user-admin-daniels',
    user_name: 'Officer Clara Daniels',
    user_email: 'c.daniels@university.edu',
    type: 'found' as const,
    category: 'Bags & Wallets' as const,
    title: 'Brown Leather Bi-fold Cardholder with Blue Collegiate Lanyard',
    description: 'Turned in to campus security desk. Contains student dining card and magnetic dorm access badge.',
    primary_color: 'Brown / Tan',
    secondary_color: 'Navy Blue',
    brand: 'Berkeley Leather Goods',
    location_zone: 'Science & Engineering Quad',
    location_detail: 'CS Hall Drafting Lab Rm 204',
    date_occurred: '2026-10-19',
    image_url: '/src/assets/images/student_badge_wallet_1792514857995.jpg',
    status: 'open' as const,
    verification_questions: [
      {
        id: 'q-301',
        report_id: 'rep-found-3',
        question: 'What is the full name or partial student ID number printed on the dining card inside?',
        hint: 'First and last name as enrolled.',
        expected_answer: 'Maya Chen'
      }
    ],
    expires_at: '2026-12-03T09:00:00Z',
    created_at: '2026-10-19T09:45:00Z',
    updated_at: '2026-10-19T09:45:00Z'
  },
  {
    id: 'rep-found-4',
    user_id: 'user-alex',
    user_name: 'Alex Rivera',
    user_email: 'alex.rivera@university.edu',
    type: 'found' as const,
    category: 'Audio & Headphones' as const,
    title: 'Sony WH-1000XM4 Wireless Noise-Cancelling Headphones',
    description: 'Matte black over-ear headphones left on a table next to a textbook in the open study salon.',
    primary_color: 'Black',
    secondary_color: 'Gold',
    brand: 'Sony',
    location_zone: 'University Main Library',
    location_detail: '2nd Floor Quiet Periodical Room',
    date_occurred: '2026-10-17',
    image_url: '/src/assets/images/wireless_headphones_1792514857659.jpg',
    status: 'open' as const,
    verification_questions: [
      {
        id: 'q-401',
        report_id: 'rep-found-4',
        question: 'What bluetooth device name is broadcast when turning the headset on?',
        hint: 'Customized device nickname in sound settings.',
        expected_answer: "Alex's XM4"
      }
    ],
    expires_at: '2026-12-01T15:00:00Z',
    created_at: '2026-10-17T15:20:00Z',
    updated_at: '2026-10-17T15:20:00Z'
  }
];
