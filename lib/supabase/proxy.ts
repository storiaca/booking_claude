import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

const SIGNED_IN_HOME = "/dashboard";
const SIGNED_OUT_HOME = "/login";
const GUEST_ONLY_PATHS = ["/login", "/register"];

function isProtectedPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  session: NextResponse,
  cacheHeaders: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const response = NextResponse.redirect(url);
  // A redirect must still carry the refreshed auth cookies and the headers
  // that stop a CDN from caching them, or the browser and server drift apart.
  session.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  Object.entries(cacheHeaders).forEach(([name, value]) =>
    response.headers.set(name, value),
  );
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // The client may write cookies more than once, but only the first write
  // carries cache headers. Collect everything so each rebuilt response is whole.
  const cookiesToSet = new Map<
    string,
    { value: string; options: CookieOptions }
  >();
  let cacheHeaders: Record<string, string> = {};

  // Always create a new client per request, never one shared between requests.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies, headers) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            cookiesToSet.set(name, { value, options });
          });
          cacheHeaders = { ...cacheHeaders, ...headers };

          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ value, options }, name) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(cacheHeaders).forEach(([name, value]) =>
            supabaseResponse.headers.set(name, value),
          );
        },
      },
    },
  );

  // Run nothing between createServerClient and getClaims. It verifies the JWT
  // and refreshes an expired token; skipping it logs users out at random.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  // Optimistic check only. The real check is verifySession() in lib/dal.ts.
  if (!isSignedIn && isProtectedPath(pathname)) {
    return redirectTo(request, SIGNED_OUT_HOME, supabaseResponse, cacheHeaders);
  }

  if (isSignedIn && GUEST_ONLY_PATHS.includes(pathname)) {
    return redirectTo(request, SIGNED_IN_HOME, supabaseResponse, cacheHeaders);
  }

  return supabaseResponse;
}
