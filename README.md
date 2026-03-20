<p align="center">
  <img alt="Folium" src="docs/logo.png" width="96" />
</p>

<p align="center">
  A modern, Notion-inspired workspace for organized thinking.
</p>

<p align="center">
  <a href="https://folium-delta.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-folium--delta.vercel.app-0ea5e9?style=for-the-badge" alt="Live Demo" /></a>
  <a href="https://github.com/Ramyprojs/Folium/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Built%20with-Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Built with Next.js" />
</p>

<p align="center">
  <a href="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white"><img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"><img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white"><img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" /></a>
  <a href="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"><img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://img.shields.io/badge/Tiptap-121212?style=flat-square&logo=tiptap&logoColor=white"><img src="https://img.shields.io/badge/Tiptap-121212?style=flat-square&logo=tiptap&logoColor=white" alt="Tiptap" /></a>
  <a href="https://img.shields.io/badge/Zustand-4B5563?style=flat-square&logo=react&logoColor=white"><img src="https://img.shields.io/badge/Zustand-4B5563?style=flat-square&logo=react&logoColor=white" alt="Zustand" /></a>
  <a href="https://img.shields.io/badge/Framer%20Motion-0055FF?style=flat-square&logo=framer&logoColor=white"><img src="https://img.shields.io/badge/Framer%20Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion" /></a>
  <a href="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white"><img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white" alt="Cloudinary" /></a>
  <a href="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"><img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" /></a>
</p>

## Overview

Folium delivers a focused, modern workspace where teams and individuals can capture ideas, structure knowledge, and publish pages without friction. It combines a Notion-style information architecture with a powerful editor, media workflows, and lightweight collaboration patterns that feel fast in daily use. The app is designed for writers, product teams, researchers, and builders who need both creative freedom and clear organization. From quick notes to shareable documentation, Folium keeps thinking and execution in one place.

- Live app: https://folium-delta.vercel.app
- Repository: https://github.com/Ramyprojs/Folium

## Screenshots

> 📸 _Screenshots coming soon — add your own by replacing the image paths below._

![Workspace](docs/workspace.png)
![Editor](docs/editor.png)
![Notes](docs/notes.png)

## Features

**Workspace & pages**

- Create and manage multiple workspaces with owner/member roles.
- Build nested page structures for organized navigation and long-form content.
- Favorite, archive, move, and share pages through a clean action model.
- Publish selected pages publicly with share links.

**Rich text editing**

- Write with headings, lists, task items, code blocks, quotes, dividers, links, and slash commands.
- Insert advanced images with resize, crop, align, lightbox, replace, and captions.
- Sketch inside the app and insert drawings directly into pages.
- Keep content safe with debounced autosave behavior.

**Floating notes**

- Open draggable notes on top of workspace pages for rapid side-by-side thinking.
- Resize, minimize, maximize, close, and snap notes to corners.
- Pin important notes on top while working across the page.
- Launch multiple notes at once and multitask fluidly.
- Create a new note instantly with `Cmd/Ctrl + Shift + N`.

**Uploads & media**

- Upload images and files from the editor.
- Embed images inline and insert non-image files as links.
- Use Cloudinary-powered uploads in production.
- Fall back gracefully for limited upload scenarios when integrations are missing.

**Authentication**

- Sign up and sign in with email/password credentials.
- Enable optional Google OAuth with NextAuth.
- Use JWT sessions for secure authenticated workflows.

## Getting started

1. Clone the repository.

```bash
git clone https://github.com/Ramyprojs/Folium.git
cd Folium
```

2. Install dependencies.

```bash
npm install
```

3. Copy environment template and configure values.

```bash
cp .env.example .env
```

4. Run database migrations.

```bash
npm run prisma:migrate
```

5. Start the development server.

```bash
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon/Supabase compatible). |
| `NEXTAUTH_SECRET` | Yes | Secret used by NextAuth for JWT/session encryption. |
| `NEXTAUTH_URL` | Recommended (prod) | Canonical app URL for auth callbacks in production. |
| `AUTH_DISABLED` | No | Development-only auth bypass flag. Keep `false` in production. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (optional login provider). |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |
| `CLOUDINARY_CLOUD_NAME` | Recommended (prod uploads) | Cloudinary cloud name for media uploads. |
| `CLOUDINARY_API_KEY` | Recommended (prod uploads) | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Recommended (prod uploads) | Cloudinary API secret. |
| `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` | No | Unsplash search integration for cover browsing. |

## Deployment

Deploy Folium on Vercel with a Neon (or compatible PostgreSQL) database by setting production environment variables and connecting the repository.

Run production migrations before or during release:

```bash
DATABASE_URL="<your-production-database-url>" npx prisma migrate deploy
```

Cloudinary is required for full upload support in production. Without Cloudinary credentials, upload flows may be limited or fallback-only.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Generate Prisma client and build the production app. |
| `npm run start` | Run the built production server. |
| `npm run lint` | Run ESLint checks across the codebase. |
| `npm run prisma:generate` | Generate Prisma client from schema. |
| `npm run prisma:migrate` | Create/apply local development migrations. |
| `npm run prisma:migrate:deploy` | Apply existing migrations to target database. |
| `npm run prisma:studio` | Open Prisma Studio for database inspection. |

## API overview

| Group | Paths |
| --- | --- |
| Auth | `/api/auth/[...nextauth]`, `/api/signup` |
| Workspaces | `/api/workspaces`, `/api/workspaces/[id]`, `/api/workspaces/[id]/members` |
| Pages | `/api/pages`, `/api/pages/[id]`, `/api/pages/[id]/children`, `/api/pages/[id]/move`, `/api/pages/[id]/archive`, `/api/pages/[id]/favorite`, `/api/pages/[id]/share` |
| Upload | `/api/upload` |
| Search | `/api/search` |
| Comments | `/api/comments/[id]` |

## Contributing

Contributions, ideas, and improvements are welcome. Open an issue to discuss bugs or feature proposals before submitting a pull request.

- Issues: https://github.com/Ramyprojs/Folium/issues

## License

MIT
