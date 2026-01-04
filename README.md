# Habit Tracker PWA

Cross-platform habit tracker (PWA) with Supabase auth/sync, React + Vite + TypeScript, Zustand for local UI state, React Query with offline read-only cache, and Apache ECharts for analytics.

## Getting Started

1. Install dependencies:
   - `npm install`
2. Set environment variables:
   - Copy `.env.example` to `.env` and fill:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
3. Run dev server:
   - `npm run dev`
4. Build for production:
   - `npm run build`

## Supabase Schema (public)

- `habits`: `id (uuid)`, `user_id`, `name`, `category`, `created_at (timestamptz)`, `archived (bool)`
- `completions`: `id (uuid)`, `habit_id`, `user_id`, `date (date)`, `completed (bool)`; unique on `(habit_id, date, user_id)`

## PWA

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js` caches shell assets for offline. React Query + localforage persists read data for offline viewing.

## Authentication

- Email/password via Supabase Auth; Google can be added later by enabling the provider and adding a button in `AuthForm`.

## Project Structure

- `src/lib` — Supabase client, query client with persistence
- `src/features/auth` — auth store/provider/form
- `src/features/habits` — hooks and UI for habits/completions
- `src/features/analytics` — charts dashboard (heatmap, bar, line, pie)
- `public` — manifest and service worker

## Notes

- Offline mode: cached queries remain readable; mutations will retry when back online.
- The UI is minimal and theme-ready; extend styling in `src/index.css`.
