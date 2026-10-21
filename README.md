# CampusFind

A campus lost-and-found web application that helps students report lost items, post found items, and connect to recover their belongings.

## Features
- Student authentication
- Lost and found item reports
- Search and filter reports
- Supabase database integration
- Responsive interface for mobile and desktop

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Deployment

CampusFind can be deployed using Cloudflare Pages by connecting the GitHub repository and configuring the Vite build settings.

## Security

Never commit secret API keys, service-role keys, or `.env` files containing secrets to GitHub. Configure database Row Level Security (RLS) before using real student data.
