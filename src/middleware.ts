import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Replaces the prototype's PAGES map + "bounce to signin.html" logic in core.js.
// This is a first gate (fast redirects); every query is ALSO protected by RLS, and server actions re-check the role.
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();          // verifies the JWT with Supabase, not just the cookie
  const path = req.nextUrl.pathname;
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url));

  if (!user) return go("/signin");
  const { data: me } = await sb.from("profiles").select("role, profile_complete").eq("id", user.id).single();
  if (!me) return go("/signin");

  const home = me.role === "admin" ? "/admin/dashboard" : "/employee/home";
  if (path.startsWith("/admin") && me.role !== "admin") return go(home);
  if (path.startsWith("/employee") && me.role !== "employee") return go(home);
  // first sign-in: nothing but the setup page is reachable until the profile is complete
  if (me.role === "employee" && !me.profile_complete && path !== "/employee/setup") return go("/employee/setup");
  if (me.role === "employee" && me.profile_complete && path === "/employee/setup") return go(home);
  return res;
}
export const config = { matcher: ["/admin/:path*", "/employee/:path*"] };
