# Clinic registration and sign-in

Status: planned, not implemented.

## Context

`/register` and `/login` are placeholder pages left by the hero task. A dental clinic cannot create an account yet, and everything else in the product (dentists, services, working hours, booking requests) needs a signed-in clinic to belong to.

This task adds real registration and sign-in for clinics, the database row that represents a clinic, and the minimum needed to prove the session works: a protected dashboard placeholder with a sign-out button.

Patients are not affected. They never sign in.

## Decisions

| Topic | Decision |
| --- | --- |
| Auth provider | Supabase Auth, email + password |
| Session | Cookie session through `@supabase/ssr`, refreshed in `proxy.ts` |
| Form handling | Next Server Actions + `useActionState` |
| Email confirmation | Off. The clinic is signed in right after registering |
| Account model | One account = one clinic (`public.clinics.owner_id` is unique) |
| Database | The connected project `iyksaxqoajycpmrcpctc` is the dev database. Apply through MCP, mirror the SQL in the repo |
| Extra scope | Sign-out, protected `/dashboard` placeholder, redirects for signed-in and signed-out visitors |
| Password rule | At least 8 characters, no composition rules |
| UI language | English, like the hero |
| Validation | Zod, on the server |

## State found during planning (2026-10-12)

- `public` schema is empty, no migrations, no users, no triggers on `auth.users`. Security advisor reports nothing.
- Postgres 17.11.
- Default privileges in `public` still grant **all** table privileges to `anon` and `authenticated`. Supabase switches existing projects to "not exposed by default" on 2026-10-30, so the migration sets grants explicitly and behaves the same before and after that date.
- No Supabase packages installed, no `.env` file. Local Node is 24.15 (`@supabase/supabase-js` needs Node 22+).
- Next 16 uses `proxy.ts`, not `middleware.ts`. `cookies()` is async. `cacheComponents` is not enabled.

## Prerequisites (manual, in the Supabase dashboard)

The MCP server cannot change Auth settings. Before implementation, in **Authentication → Sign In / Providers → Email**:

1. Turn **Confirm email** off (hosted projects have it on by default).
2. Set **Minimum password length** to 8, so the Auth API enforces the same rule as the form.

## Database

One migration, applied with MCP `apply_migration`, name `create_clinics`.

```sql
create schema if not exists private;

create table public.clinics (
  id bigint generated always as identity primary key,
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null
    constraint clinics_name_length check (char_length(btrim(name)) between 2 and 100),
  created_at timestamptz not null default now()
);

alter table public.clinics enable row level security;

revoke all on public.clinics from anon, authenticated;
grant select on public.clinics to authenticated;
grant select, insert, update, delete on public.clinics to service_role;

create policy "Owners can view their own clinic"
  on public.clinics for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.clinics (owner_id, name)
  values (new.id, btrim(new.raw_user_meta_data ->> 'clinic_name'));
  return new;
end;
$$;

revoke execute on function private.handle_new_user()
  from public, anon, authenticated, service_role;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
```

Why it looks like this:

- **Trigger, not a second insert from the app.** The user and the clinic are created in one transaction, so an account can never exist without its clinic. The clinic name travels as `options.data.clinic_name` in `signUp`.
- **The trigger also validates.** Anyone can call the Auth API directly with the publishable key. A missing or out-of-range `clinic_name` violates `not null` or the check constraint, and the sign-up fails.
- **`private` schema.** The function is `security definer`, so it stays out of the schemas the Data API exposes, with `search_path = ''` and `execute` revoked.
- **`owner_id unique`** enforces one clinic per account and is the index the RLS policy uses. `(select auth.uid())` is evaluated once per query, not per row.
- **`bigint identity` key**, per the project's Postgres skill. The id is never shown publicly; the booking link will use a slug.
- **Read-only for now.** `authenticated` gets `select` only. `anon` gets nothing. Update grants and policies come with the clinic settings task.
- `raw_user_meta_data` is user-editable after sign-up. `public.clinics.name` is the source of truth; app code never reads the clinic name from the JWT or user metadata.

After applying: read the version back with `list_migrations` and save the same SQL as `supabase/migrations/<version>_create_clinics.sql`. Run `get_advisors` (security) and generate types with `generate_typescript_types` into `lib/supabase/database.types.ts`.

## Application

### Files

| File | Change |
| --- | --- |
| `package.json`, `package-lock.json` | Add `@supabase/supabase-js`, `@supabase/ssr`, `zod`, exact versions |
| `.env.local` | New, not committed. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `.env.example`, `.gitignore` | New example file with placeholders; add `!.env.example` |
| `lib/supabase/server.ts` | New. Server client bound to `cookies()` |
| `lib/supabase/proxy.ts` | New. `updateSession()` plus redirect rules |
| `lib/supabase/database.types.ts` | New, generated |
| `proxy.ts` | New. Calls `updateSession()` |
| `lib/validation/auth.ts` | New. Zod schemas and the form state type |
| `app/actions/auth.ts` | New. `register`, `login`, `logout` |
| `lib/dal.ts` | New. `verifySession()`, `getClinic()` |
| `components/ui/button.ts` | New. Button classes moved out of the hero |
| `components/ui/form-field.tsx` | New. Label + input + error text |
| `components/auth/register-form.tsx`, `components/auth/login-form.tsx` | New. Client Components |
| `app/register/page.tsx`, `app/login/page.tsx` | Replace the placeholders |
| `app/dashboard/page.tsx` | New. Protected placeholder |
| `components/hero.tsx` | Import the shared button classes |
| `app/globals.css` | Add a `destructive` colour token |
| `CLAUDE.md` | Replace the "auth is not decided" line with what is now decided |

### 1. Dependencies and environment

- Install with `npm install --save-exact`. Latest on 2026-10-12: `@supabase/supabase-js` 2.117.3, `@supabase/ssr` 0.12.7, `zod` 4.6.6. Re-check at implementation time.
- Read the URL and the publishable key (`sb_publishable_…`, not the legacy anon key) through MCP `get_project_url` and `get_publishable_keys`.
- No secret or service-role key is needed anywhere in this task.

### 2. Supabase clients (`lib/supabase/`)

Start from Supabase's official Next.js example (`examples/auth/nextjs` in `supabase/supabase`) and re-check the current SSR guide first, as `CLAUDE.md` requires.

- `server.ts`: `createClient()` awaits `cookies()` and passes `getAll` / `setAll` to `createServerClient<Database>`. `setAll` swallows the error thrown in Server Components, because the proxy refreshes the session. Marked `import 'server-only'` (Next resolves it internally, no package needed).
- No browser client. Nothing in this task talks to Supabase from the browser; add `client.ts` when something does.

### 3. Proxy (`proxy.ts`, `lib/supabase/proxy.ts`)

`updateSession()` builds a server client on the request cookies and calls `supabase.auth.getClaims()` immediately, with no code in between. That call verifies the JWT and refreshes an expired token. `getSession()` is never used for decisions on the server.

Redirect rules, applied after `getClaims()`:

| Visitor | Path | Result |
| --- | --- | --- |
| Signed out | `/dashboard`, `/dashboard/*` | Redirect to `/login` |
| Signed in | `/login`, `/register` | Redirect to `/dashboard` |
| Anyone | Everything else | Pass through |

A redirect response must carry the refreshed cookies and cache headers copied from `supabaseResponse`; otherwise return `supabaseResponse` untouched.

Matcher, as in the Supabase example, so static assets skip the proxy:

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

The proxy is an optimistic check only. The real check is in the DAL (step 6).

### 4. Validation (`lib/validation/auth.ts`)

| Field | Register | Sign in |
| --- | --- | --- |
| Clinic name | Trimmed, 2–100 characters | — |
| Email | Trimmed, lower-cased, valid email | Same |
| Password | 8–72 characters, not trimmed (72 is the bcrypt limit; confirm against Supabase docs) | Required only |
| Confirm password | Must equal password; error attached to this field | — |

Sign-in does not apply the length rule, so the form never hints at the password policy.

Form state returned by the actions:

```ts
export type AuthFormState = {
  errors?: Partial<Record<'clinicName' | 'email' | 'password' | 'confirmPassword', string[]>>
  message?: string
  values?: { clinicName?: string; email?: string }
}
```

`values` exists because React 19 resets a form after its action runs. Clinic name and email are sent back and used as `defaultValue`. Passwords are never sent back.

### 5. Server Actions (`app/actions/auth.ts`)

All three live in one `'use server'` file. `redirect()` is called outside any `try` block.

**`register(prevState, formData)`**

1. Validate with Zod. On failure return `errors` and `values`.
2. `supabase.auth.signUp({ email, password, options: { data: { clinic_name } } })`.
3. On error return a mapped `message`.
4. If there is no `data.session`, email confirmation is still on: return "Check your inbox to confirm your email, then sign in."
5. `redirect('/dashboard')`.

**`login(prevState, formData)`**: validate, `signInWithPassword`, map errors, `redirect('/dashboard')`.

**`logout()`**: `signOut({ scope: 'local' })`, so other devices of the same clinic stay signed in, then `redirect('/login')`.

Error mapping, by Supabase error `code`:

| Code | Message |
| --- | --- |
| `user_already_exists` | An account with this email already exists. |
| `invalid_credentials` | Invalid email or password. |
| `email_not_confirmed` | Confirm your email before signing in. |
| `weak_password` | Password must be at least 8 characters. |
| `email_address_invalid` | Enter a valid email address. |
| `over_request_rate_limit` | Too many attempts. Try again in a few minutes. |
| anything else | Something went wrong. Please try again. |

Raw Supabase messages are never shown to the user.

### 6. Data access layer (`lib/dal.ts`)

Follows the DAL pattern from the Next 16 authentication guide. `import 'server-only'`, both functions wrapped in React `cache`.

- `verifySession()`: `getClaims()`; no claims → `redirect('/login')`; returns `{ userId, email }`.
- `getClinic()`: calls `verifySession()`, then selects `id, name` from `clinics` for that owner. RLS enforces the same filter in the database.

Every future protected page and Server Action calls `verifySession()` itself. Layouts are not used for auth checks.

### 7. UI

Design follows the hero: same tokens, Tailwind utilities only, light and dark.

- `app/globals.css`: add `--destructive` (`#b91c1c` light, `#f87171` dark) and map it in `@theme inline`, for error text and invalid borders. Both clear WCAG AA on the page background.
- `components/ui/button.ts`: move `buttonBase` from `components/hero.tsx` here with `primary` and `secondary` variants. The hero plan deferred this until the auth forms needed it.
- `components/ui/form-field.tsx`: `<label>` tied to the input, optional hint, error text linked with `aria-describedby`, `aria-invalid` on the input.
- Forms are Client Components using `useActionState`. The submit button is disabled and relabelled while pending. The form-level `message` renders in a `role="alert"` element.
- Native attributes back up the server rules: `required`, `type="email"`, `minLength={8}`, and `autoComplete` of `organization`, `email`, `new-password` (register) and `current-password` (sign in).

Pages keep their current metadata (`title`, `robots: { index: false }`) and stay static; only the form is a Client Component.

| Page | Content |
| --- | --- |
| `/register` | Heading `Register your clinic`. Fields `Clinic name`, `Email`, `Password` (hint `At least 8 characters`), `Confirm password`. Button `Create account`. Link `Already have an account? Sign in`. |
| `/login` | Heading `Clinic sign in`. Fields `Email`, `Password`. Button `Sign in`. Link `New to SmileSlot? Register your clinic`. |
| `/dashboard` | Clinic name as `h1`, `Signed in as {email}`, a line saying the dashboard is coming soon, `Sign out` button in a `<form action={logout}>`. |

### 8. `CLAUDE.md`

Replace "Auth, data-access patterns and the dev/prod environment setup are not decided yet" with the decisions above: Supabase Auth through `@supabase/ssr`, Server Actions plus the DAL, RLS on every table, the connected project as the dev database with SQL mirrored in `supabase/migrations/`. Production setup stays undecided.

## Steps

- [ ] Dashboard prerequisites done (Confirm email off, minimum length 8)
- [ ] Re-read the current Supabase SSR guide and changelog
- [ ] Apply the `create_clinics` migration, save the SQL file, run advisors, generate types
- [ ] Install dependencies, add `.env.local` and `.env.example`
- [ ] Add `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `proxy.ts`
- [ ] Add `lib/validation/auth.ts`, `app/actions/auth.ts`, `lib/dal.ts`
- [ ] Add the token, shared button classes and form field; update the hero import
- [ ] Add both forms; replace `/register` and `/login`; add `/dashboard`
- [ ] Update `CLAUDE.md`
- [ ] Verify

## Verification

1. `npm run lint` and `npm run build` pass. The build lists `/`, `/login`, `/register` as static, `/dashboard` as dynamic, and the proxy.
2. Database, through MCP:
   - `get_advisors` (security) reports nothing new.
   - As `anon`, `select` on `public.clinics` is denied. As `authenticated` with another user's `sub`, it returns 0 rows.
3. In the browser on `npm run dev`. Use a real mailbox with plus-addressing (`you+clinic1@…`); Supabase rejects example and test domains.
   - Register → lands on `/dashboard` with the clinic name. One row in `auth.users`, one in `public.clinics`, same owner.
   - Sign out → `/login`. Sign in again → `/dashboard`. Reload keeps the session.
   - Wrong password → `Invalid email or password.` and the email stays filled in.
   - Same email again → `An account with this email already exists.`
   - Mismatched passwords, 7-character password, 1-character clinic name → field errors, no account created.
   - Signed out, open `/dashboard` → `/login`. Signed in, open `/login` or `/register` → `/dashboard`.
   - 375 px width, light and dark themes, keyboard-only pass with visible focus and errors announced.
4. Sign up through the Auth API without `clinic_name` → fails, and no user row is left behind.
5. Delete the test accounts afterwards, after confirming. The cascade removes their clinics.

## Not included

- Forgot / reset password, and email confirmation. Both depend on outgoing email and a custom SMTP setup.
- The public booking slug. It comes with the booking link task.
- Editing the clinic name, and any real dashboard content or navigation.
- A `?next=` return path after sign-in. Sign-in always goes to `/dashboard`.
- Social login, MFA, staff accounts, a browser Supabase client.
- Production environment setup.
- A git commit. Nothing is committed unless asked.
