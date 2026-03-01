# Tenant Rent Management System

A modern, responsive web application for managing tenant details and tracking rental payments.

## Tech Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Supabase (Auth + PostgreSQL)
- jsPDF

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the script in `supabase-setup.sql`
3. Go to Settings → API and copy:
   - Project URL
   - anon public key

### 3. Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

## Deployment

### Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

## Features

- Secure authentication
- Tenant management (Add/Edit/Delete)
- Rent payment tracking
- Dashboard with statistics
- PDF export (bank-style statements)
- Fully responsive design
- Mobile-friendly UI

## Security

- Row Level Security enabled
- HTTPS enforced
- Sensitive data masked in UI
