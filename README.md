# Folium (Next.js 14)

Production-ready Notion-style workspace app built with:
- Next.js 14 App Router + TypeScript
- Tailwind CSS + reusable shadcn-style UI primitives
- Prisma + PostgreSQL
- NextAuth (Credentials + Google OAuth)
- Tiptap rich text editor
- Zustand + TanStack Query
- Framer Motion interactions
- Cloudinary upload API

## Features Implemented

### Authentication
- Email/password signup and login
- Google OAuth via NextAuth
- JWT session strategy
- Auth middleware protection for app routes

### Workspace + Pages
- Create and list workspaces
- Role-based workspace membership (OWNER/EDITOR/VIEWER)
- Invite/remove members via API
- Page CRUD, archive/favorite/share toggles
- Nested parent-child page structure with move API
- Public page share endpoint

### Notion-style UI
- Left sidebar with page list and resize handle
- Workspace page route: /[workspaceId]/[pageId]
- Top toolbar for page title/edit/share/favorite/archive
- Search modal (Cmd/Ctrl + K pathway)
- Settings pages: profile, workspace, billing (UI)

### Rich Editor
- Tiptap editor with:
  - headings/paragraph/list/task list
  - underline/highlight
  - horizontal rule
  - code block (lowlight)
- Debounced autosave every 1.5s to page JSON content

### Database + Comments APIs
- Inline database row CRUD APIs
- Comments APIs:
  - GET/POST /api/comments/[id] (treat id as page id)
  - PATCH/DELETE /api/comments/[id] (treat id as comment id)

### Deployment
- .env example provided
- Multi-stage Dockerfile
- Prisma migrations can be applied separately before boot

## Quick Start

1. Install dependencies

```bash
npm install
```

Use Node 20 LTS for local builds and production images.

2. Copy environment file

```bash
cp .env.example .env
```

3. Configure required env vars in .env

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- NEXT_PUBLIC_UNSPLASH_ACCESS_KEY (optional, enables Unsplash cover search)
- AUTH_DISABLED=false (optional; local `next dev` only convenience flag)

4. Run migrations + generate client

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Start dev server

```bash
npm run dev
```

Open http://localhost:3000

## Docker

Build and run:

```bash
docker build -t notion-clone .
docker run --env-file .env -p 3000:3000 notion-clone
```

For production rollouts outside Docker, apply migrations before boot:

```bash
npm run prisma:migrate:deploy
```

Then start the app:

```bash
npm run start
```

## API Routes

- /api/auth/[...nextauth]
- /api/signup
- /api/workspaces
- /api/workspaces/[id]
- /api/workspaces/[id]/members
- /api/pages
- /api/pages/[id]
- /api/pages/[id]/children
- /api/pages/[id]/move
- /api/pages/[id]/archive
- /api/pages/[id]/favorite
- /api/pages/[id]/share
- /api/databases/[id]/rows
- /api/databases/[id]/rows/[rid]
- /api/search
- /api/upload
- /api/comments/[id]

## Notes

- Comment endpoint is consolidated under one dynamic segment due Next.js App Router slug constraints.
- Search currently uses title + JSON contains filter and returns recent matching pages.
- Some advanced Notion interactions (realtime cursors, full slash command palette graph, advanced relational formula engine, full drag reparenting UX across all blocks) are scaffolded structurally and can be extended in-place.

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
