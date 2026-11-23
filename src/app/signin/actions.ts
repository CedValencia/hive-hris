"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

<<<<<<< HEAD
const schema = z.object({ identifier: z.string().trim().min(1, "Enter your email or username."), password: z.string().min(1, "Enter your password.") });
=======
const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
});
>>>>>>> e8f8b1b (signin complete)

/** Sign in by username, email or employee ID (HV-001). Supabase Auth itself only knows emails, so resolve first. */
export async function signIn(_: unknown, fd: FormData): Promise<{ error?: string }> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { identifier, password } = parsed.data;

<<<<<<< HEAD
  const { data: row } = await supabaseAdmin().from("profiles").select("email, role, profile_complete")
    .or(`username.ilike.${identifier.replace(/[,()]/g, "")},email.ilike.${identifier.replace(/[,()]/g, "")},employee_code.ilike.${identifier.replace(/[,()]/g, "")}`).maybeSingle();

  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email: row?.email ?? "nobody@invalid.local", password });
  // One generic message for "no such user" and "wrong password" so the form can't be used to discover accounts.

  if (error || !row) return { error: "Incorrect username or password. If HR created your account, use the temporary password they gave you." };

  redirect(row.role === "admin" ? "/admin/dashboard" : row.profile_complete ? "/employee/home" : "/employee/setup");
}
=======
  // Strip characters that would break the PostgREST filter string.
  const id = identifier.replace(/[,()]/g, "");

  let target: string;

  try {
    const { data: rows, error: lookupError } = await supabaseAdmin()
      .from("profiles")
      .select("email, role, profile_complete")
      .or(
        `username.eq.${id.toLowerCase()},email.eq.${id.toLowerCase()},employee_code.eq.${id.toUpperCase()}`
      )
      .limit(1);

    if (lookupError) {
      console.error("[signIn] profile lookup failed:", lookupError);
      // TEMP DEBUG: alisin pag gumana na
      return { error: `DEBUG lookup: ${lookupError.code} - ${lookupError.message}` };
    }

    const row = rows?.[0];
    if (!row) {
      console.error("[signIn] no profile matched:", id);
      return {
        error:
          "Incorrect username or password. If HR created your account, use the temporary password they gave you.",
      };
    }

    const sb = await supabaseServer();
    const { error } = await sb.auth.signInWithPassword({ email: row.email, password });

    if (error) {
      console.error("[signIn] auth error:", error.message);
      // TEMP DEBUG: alisin pag gumana na
      return { error: `DEBUG auth: ${error.message}` };
    }

    target =
      row.role === "admin"
        ? "/admin/dashboard"
        : row.profile_complete
          ? "/employee/home"
          : "/employee/setup";
  } catch (e) {
    console.error("[signIn] unexpected error:", e);
    // TEMP DEBUG: alisin pag gumana na
    return { error: `DEBUG exception: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Nasa labas ng try/catch kasi nagta-throw ang redirect() internally.
  redirect(target);
}
>>>>>>> e8f8b1b (signin complete)
