# Folium

Folium is a modern, Notion-inspired workspace app built with Next.js, Prisma, and Tiptap. It supports collaborative-style page organization, rich content editing, authentication, shareable pages, and production deployment on Vercel.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- React 18 + Tailwind CSS
- Prisma + PostgreSQL (Neon/Supabase compatible)
- NextAuth (Credentials + optional Google OAuth)
- Tiptap editor with custom advanced image extension
- TanStack Query + Zustand
- Framer Motion
- Cloudinary upload pipeline

## Core Features

### Workspace and Page Management

- Multi-workspace model with owner/member roles
- Hierarchical page tree (nested pages)
- Favorite, archive, move, and share actions
- Public page sharing endpoint

### Rich Editing Experience

- Tiptap-based editor with headings, lists, tasks, quote, code, divider, links
- Slash command UI for fast block insertion
- Advanced image node with resize, crop, align, lightbox, replace, caption
- Drawing pad export/insert workflow
- Debounced autosave

### Floating Notes (Productivity Layer)

- Draggable floating notes on workspace pages
- Resize, minimize, maximize, close
- Snap/dock to corners
- Pin note always-on-top
- Per-note customization:
  - font family and font size
  - light/dark note theme
  - note background color
  - note opacity
- Multi-note support with independent state
- Keyboard shortcut: `Cmd/Ctrl + Shift + N` to create a new note

### Uploads

- Image uploads from editor and cover picker
- Generic file uploads (non-image files inserted as links)
- Client-side large-image normalization for better reliability
- Graceful fallback behavior when uploads are partially configured

### Authentication

- Email/password signup/login
- Optional Google OAuth
- JWT-based sessions via NextAuth
- Route protection for app surfaces

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Minimum required variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`

Recommended in production:

- `NEXTAUTH_URL`
- `AUTH_DISABLED=false`

Optional integrations:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`

### 3. Apply database migrations

```bash
npm run prisma:migrate:deploy
```

For local development, `prisma:migrate` is also available.

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production Deployment (Vercel + Neon)

1. Import repository into Vercel.
2. Set required environment variables in Vercel project settings.
3. Run Prisma migrations against your production database:

```bash
DATABASE_URL="<your_db_url>" npx prisma migrate deploy
```

4. Redeploy.

### Important Upload Note

For full binary upload support in production, configure Cloudinary variables. Without Cloudinary, some file flows are intentionally restricted/fallback-only.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:studio
```

## API Surface (High-Level)

- Auth: `/api/auth/[...nextauth]`, `/api/signup`
- Workspaces: `/api/workspaces`, `/api/workspaces/[id]`, `/api/workspaces/[id]/members`
- Pages: `/api/pages`, `/api/pages/[id]`, `/api/pages/[id]/children`, `/api/pages/[id]/move`, `/api/pages/[id]/archive`, `/api/pages/[id]/favorite`, `/api/pages/[id]/share`
- Data rows: `/api/databases/[id]/rows`, `/api/databases/[id]/rows/[rid]`
- Search: `/api/search`
- Upload: `/api/upload`
- Comments: `/api/comments/[id]`

## Project Status

Folium is actively evolving, with emphasis on practical editing workflows, deployability, and user-facing UX polish across desktop and mobile.
