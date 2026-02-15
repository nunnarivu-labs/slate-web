# CLAUDE.md — Slate Web

## Project Overview

Slate is a minimalist note-taking web app with Markdown support, tagging, and AI features. Deployed at https://slate.nunnarivulabs.in.

## Tech Stack

- **Framework**: TanStack Start (React 19, SSR) with Vite 7
- **Routing**: TanStack Router — file-based, type-safe (`src/routes/`)
- **Server State**: TanStack Query + Convex (real-time serverless DB)
- **Auth**: Clerk (JWT, integrated with Convex via `@clerk/tanstack-react-start`)
- **AI**: Google Gemini (`gemini-2.0-flash-lite`) via `@google/genai`
- **Styling**: Tailwind CSS 4.0 + Lucide React icons
- **Validation**: Zod
- **Testing**: Vitest + Testing Library
- **Deployment**: Netlify

## Commands

- `npm run dev` — Start dev server on port 5173
- `npm run convex` — Start Convex dev backend (`npx convex dev`)
- `npm run build` — Production build
- `npm run test` — Run tests (`vitest run`)
- `npm run prettier` — Format all files

Both `dev` and `convex` must run simultaneously during development.

## Project Structure

```
src/
  routes/             # File-based routing (TanStack Router)
    __root.tsx        # Root layout with Clerk + Convex providers
    login.tsx         # Login page
    _auth/            # Protected routes (requires authentication)
      notes/
        $category/    # active | archive | trash
          $id.tsx     # Note editor modal (id='new' for create)
  components/
    card/             # NoteCard, AddNoteCard
      modal/          # NoteModal, NoteModalContainer
      popover/        # TagInputPopover
    content/          # ContentEditor, Markdown renderer
    layout/           # AppLayout, Sidebar, NotesApp
      tag/            # TagList, TagListItem
  data/
    auth.ts           # Server-side auth function
    ai.ts             # AI server functions (summarize, suggestTags, extractActionItems)
    prompts/          # AI prompt templates
  hooks/              # Custom hooks (useSaveNote)
  types/              # TypeScript types (note, tag, note-category, etc.)
  utils/              # Convex type converters, category param helpers
  integrations/       # TanStack Query client setup

convex/               # Convex backend
  schema.ts           # DB schema (users, notes, tags, tagNote)
  tasks.ts            # Queries & mutations
  taskHelpers.ts      # Shared query/mutation helpers
  crons.ts            # Scheduled cleanup jobs
  auth.config.ts      # Clerk auth config
```

## Key Architecture Patterns

- **Server functions** use `createServerFn()` from `@tanstack/react-start`
- **Convex queries/mutations** are consumed via `@convex-dev/react-query` integration
- **Route tree** is auto-generated in `src/routeTree.gen.ts` — do not edit manually
- **Auth flow**: Clerk session → JWT → Convex identity; all DB queries scoped by `userId`
- **Tag status tracking**: Tags use statuses (`NEWLY_ADDED`, `REMOVED`, `NEWLY_CREATED`, `ALREADY_ADDED`) for managing tag changes before save
- **Type converters** in `src/utils/convex-type-converters.ts` map Convex docs to frontend types

## Database Schema (Convex)

- **users** — `authProviderUserId` (Clerk ID)
- **notes** — `userId`, `title`, `content`, `category` (active/archive/trash), `updatedAt`
- **tags** — `userId`, `name`
- **tagNote** — `tagId`, `noteId` (junction table)

## Environment Variables

Required in `.env.local`:
- `CONVEX_DEPLOYMENT` — Convex dev deployment ID
- `VITE_CONVEX_URL` — Convex cloud endpoint
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk secret (server-only)
- `GEMINI_API_KEY` — Google Gemini API key

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Prettier with Tailwind plugin and sorted imports
- Prefer Convex mutations/queries over direct API calls
- Dark mode supported via Tailwind `dark:` classes
