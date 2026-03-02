# ProjectGuard AI

Production-ready SaaS landing + login implementation with a cinematic AI scanning background.

## Stack
- Next.js App Router + TypeScript
- TailwindCSS
- Framer Motion
- MongoDB + Mongoose
- FastAPI integration scaffold via `/app/api/scan`

## Run locally
1. Install dependencies:
   `npm install`
2. Create environment file from `.env.example`.
3. Start dev server:
   `npm run dev`

## Key folders
- `app/` App Router pages + API routes
- `components/` UI and animated background components
- `lib/` MongoDB connection utility
- `models/` Mongoose schemas
- `api/` server-side FastAPI client
- `animations/` Framer Motion variants
- `utils/` panel config and reusable data
