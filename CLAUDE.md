# Booking app

Dental appointment booking web app: clinics publish their availability and patients request appointments through a public link. See `PROJECT_DESCRIPTION.md` for the full description.

## First message

On the first message of every chat, do nothing and reply only with "spreman sam".

## Stack

- **Next.js 16.4.0**: App Router (`app/`), React 19.2, TypeScript in strict mode. Import alias `@/*` maps to the project root.
- **Supabase**: the database and part of the backend.
- **Tailwind CSS v4**: all UI styling.
- **npm**: as package manager

## Commands

- `npm run dev`: start the dev server
- `npm run build`: production build, which also type-checks
- `npm run lint`: ESLint

## Supabase

- Do all database work through the Supabase MCP server. It has full read-write access, not read-only.
- Read the current schema through MCP before writing queries or types. Do not guess table or column names.
- Auth, data-access patterns and the dev/prod environment setup are not decided yet. Ask instead of assuming.

## UI

- Style with Tailwind utility classes. Do not add CSS modules, inline styles or another styling library.
- Tailwind v4 is configured in CSS, not in `tailwind.config.js`. Design tokens go in the `@theme` block in `app/globals.css`.

## Project Description

Always read this file: @PROJECT_DESCRIPTION.md

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
