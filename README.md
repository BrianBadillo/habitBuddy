# HabitBuddy

HabitBuddy is a full-stack habit tracker with a virtual pet companion. Track habits, level up your pet and (as an admin) manage pet types and users. 

## Roles
- Liam Messinger: Backend
- Brian Badillo: Frontend(Main user pages)
- Amelia Gankhuyag: Frontend(Admin User + Pet Page)

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind
- **Backend:** Express + Supabase (Postgres + Auth)
- **Styling/Tooling:** Tailwind, ESLint

## Repository Layout
- `frontend/` — Next.js app (UI, auth, dashboards, admin, pet)
- `server/` — Express API (auth, habits, pets, admin, templates)
- `server/routes/*.js` — Route handlers (auth, habits, pet, admin, templates)

## Prerequisites
- Node.js 18+ and npm
- Supabase project (or Postgres + Supabase client) with tables defined in `server/db/tables.js`

## Quick Start
### Backend
```bash
cd server
npm install
npm run dev   # starts API on http://localhost:3001
```
Set environment variables in `server/.env`
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # starts Next.js on http://localhost:3000
```

### Auth & Admin
- Sign up via `/auth`.
- To make an admin, set the user’s `role` to `admin` in the `profiles` table (Supabase) for the target user.
- Admin UI: `/admin` (visible when logged in as admin).

## Key Features / Routes

### Habits & Pet
- Habit check-ins grant XP and improve pet mood (see `server/routes/habits.js`).

### Templates (Recommended Habits)
- Admin CRUD: `/api/admin/templates` (list/create/update/delete).
- User read-only: `/api/templates`.
- Frontend surfaces recommended habits on the dashboard with one-click add.

### Admin (Pet Types & Users)
- Pet types: list/create/update/delete at `/api/admin/pet-types` (+ stages).
- User roles: `/api/admin/users`, `/api/admin/users/:userId/role`.
- Metrics: `/api/admin/metrics/overview`.
- Admin UI sections: metrics, pet types & stages, habit templates, user roles.

### API Notes
- Base URL: `http://localhost:3001/api`
- Auth: session cookie `session` (set via login).
- Most routes require auth; admin routes require `role = admin`.
- See [API_ROUTES.md](API_ROUTES.md) for full endpoint descriptions.

## Screenshots

- Dashboard Page (habits + pet): ![Dashboard Screenshot](images/a.png)
- Habits Page: ![Habits Screenshot](images/b.png)
- Friends Page: ![Friends Screenshot](images/c.png)
- Leaderboard Page: ![Leaderboard Screenshot](images/d.png)
- Pet Page: ![Pet Screenshot](images/e.png)
- Adopt a new pet: ![Adopt Screenshot](images/f.png)
- Admin Page: ![Admin Screenshot](images/g.png)