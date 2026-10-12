# Home page hero section

Status: planned, not implemented.

## Context

The home page (`app/page.tsx`) is still the untouched `create-next-app` template. It needs a hero section that tells a dental clinic what the platform does and gives it two ways in: register a clinic, or sign in to an existing one.

Patients never land here. They arrive through a clinic's public booking link, so the hero speaks only to clinics.

## Decisions

| Topic | Decision |
| --- | --- |
| UI language | English, `lang="en"` stays |
| Working name | SmileSlot (domain and trademark not checked) |
| Layout | Centered, text only, full viewport height |
| Brand colour | Teal accent |
| Themes | Light and dark, following the system setting |
| Button targets | `/register` and `/login`, each with a temporary placeholder page |

Auth is still undecided (see `CLAUDE.md`), so this task adds no forms, no Supabase calls and no session logic. The placeholder pages exist only so the buttons do not lead to a 404.

## Copy

- Eyebrow: `SmileSlot`
- Heading (`h1`): `Online booking for your dental clinic`
- Description: `Publish your availability, share one booking link, and let patients request appointments without creating an account. You approve every request and stay in control of your calendar.`
- Primary button: `Register your clinic` → `/register`
- Secondary button: `Clinic sign in` → `/login`

## Technical implementation

Everything is a Server Component. There is no client JavaScript of its own, no data fetching and no new dependency, so all three routes prerender as static pages.

### Files

| File | Change |
| --- | --- |
| `lib/site.ts` | New. `SITE_NAME` constant, so renaming the working name is a one-line change. |
| `app/globals.css` | Add colour tokens, drop the Arial override. |
| `app/layout.tsx` | Replace the template metadata. |
| `components/hero.tsx` | New. The hero section. |
| `app/page.tsx` | Replace the template with `<Hero />`. |
| `app/register/page.tsx` | New. Placeholder. |
| `app/login/page.tsx` | New. Placeholder. |

`components/` and `lib/` are new top-level folders, imported through the existing `@/*` alias.

### 1. Design tokens (`app/globals.css`)

Follow the pattern the file already uses: raw values on `:root`, dark overrides in the `prefers-color-scheme` media query, and a mapping in `@theme inline` that turns them into Tailwind utilities.

| Token | Light | Dark | Utility |
| --- | --- | --- | --- |
| `--brand` | `#0f766e` | `#2dd4bf` | `bg-brand`, `text-brand` |
| `--brand-hover` | `#115e59` | `#5eead4` | `hover:bg-brand-hover` |
| `--brand-foreground` | `#ffffff` | `#042f2e` | `text-brand-foreground` |
| `--muted-foreground` | `#52525b` | `#a1a1aa` | `text-muted-foreground` |
| `--border` | `#e4e4e7` | `#27272a` | `border-border` |

All text and button pairings clear WCAG AA contrast (4.5:1) in both themes. The light brand is teal 700 rather than the brighter teal 600 because white text on teal 600 reaches only 3.7:1.

Also remove `font-family: Arial, Helvetica, sans-serif` from the `body` rule. It is unlayered CSS, so it beats Tailwind's layered styles and currently hides the Geist font everywhere except where `font-sans` is set by hand. Without it, Tailwind's base styles apply `--font-sans` (Geist) to the whole document.

### 2. Site name (`lib/site.ts`)

```ts
export const SITE_NAME = "SmileSlot";
```

### 3. Metadata (`app/layout.tsx`)

```ts
export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Online booking for dental clinics`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "SmileSlot lets dental clinics publish their availability and receive appointment requests through a public booking link. Patients book without an account.",
};
```

Per the Next 16 docs, `title.template` applies to child segments only, so the home page gets `default` and the placeholder pages get `Register your clinic | SmileSlot`. Fonts, `lang` and the `LayoutProps<"/">` typing stay as they are.

### 4. Hero (`components/hero.tsx`)

A named export `Hero`, built from semantic elements and Tailwind utilities only:

```tsx
<section className="flex flex-1 items-center justify-center px-6 py-24 sm:py-32">
  <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
    <p className="text-sm font-semibold tracking-wide text-brand">{SITE_NAME}</p>
    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">…</h1>
    <p className="mt-6 text-lg leading-8 text-pretty text-muted-foreground">…</p>
    <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      <Link href="/register" className="… bg-brand text-brand-foreground hover:bg-brand-hover">…</Link>
      <Link href="/login" className="… border border-border hover:bg-foreground/5">…</Link>
    </div>
  </div>
</section>
```

- Both buttons are `next/link` `<Link>` elements, not `<button>`, because they navigate. That gives client-side transitions and production prefetching for free.
- Shared button classes: `inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-colors`, plus a visible keyboard focus ring (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`).
- Responsive: buttons stack at full width on phones and sit side by side from `sm` up. The heading scales from `text-4xl` to `text-6xl`.
- Full height: the root layout already makes `body` a `min-h-full` flex column, so `flex-1` on the section fills the viewport without a hard-coded height.
- No shared button component yet. Two links do not justify one; extract it when the auth forms need the same styles.

### 5. Home page (`app/page.tsx`)

```tsx
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
    </main>
  );
}
```

### 6. Placeholder pages (`app/register/page.tsx`, `app/login/page.tsx`)

Each is a small self-contained page: a centered heading (`Register your clinic` / `Clinic sign in`), one line saying the form is coming soon, and a `Back to home` link. Each exports its own metadata with a `title` and `robots: { index: false }`, so search engines skip them.

They are kept as two separate files with no shared component, so the auth task can replace each one outright.

## Steps

- [ ] Add `lib/site.ts`
- [ ] Update tokens and the `body` rule in `app/globals.css`
- [ ] Update metadata in `app/layout.tsx`
- [ ] Add `components/hero.tsx`
- [ ] Replace `app/page.tsx`
- [ ] Add `app/register/page.tsx` and `app/login/page.tsx`
- [ ] Verify

## Verification

1. `npm run lint` passes.
2. `npm run build` passes its type-check and lists `/`, `/login` and `/register` as static (`○`).
3. `npm run dev`, then request `/`, `/register` and `/login` and confirm the heading, the description, both `href` values and the page titles are in the HTML.
4. In a browser:
   - at 375 px the buttons stack and nothing overflows; on desktop they sit side by side
   - the hero fills the viewport height and the text renders in Geist, not Arial
   - light and dark themes are both readable (DevTools → Rendering → emulate `prefers-color-scheme`)
   - `Tab` reaches both buttons with a visible focus ring, and each one opens its page

Running `next dev` may re-add its agent-instructions block to `CLAUDE.md` or `AGENTS.md`. That change comes from Next, not from this task.

## Not included

- Real registration and sign-in. Auth is undecided.
- A navigation bar, footer or further landing sections.
- Removing the unused template SVGs in `public/`. `next.svg` and `vercel.svg` become unreferenced after this change; the other three already are.
- A git commit. Nothing is committed unless asked.
