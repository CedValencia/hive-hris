"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({ identifier: z.string().trim().min(1, "Enter your email or username."), password: z.string().min(1, "Enter your password.") });

/** Sign in by username, email or employee ID (HV-001). Supabase Auth itself only knows emails, so resolve first. */
export async function signIn(_: unknown, fd: FormData): Promise<{ error?: string }> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { identifier, password } = parsed.data;

  const { data: row } = await supabaseAdmin().from("profiles").select("email, role, profile_complete")
    .or(`username.ilike.${identifier.replace(/[,()]/g, "")},email.ilike.${identifier.replace(/[,()]/g, "")},employee_code.ilike.${identifier.replace(/[,()]/g, "")}`).maybeSingle();

  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email: row?.email ?? "nobody@invalid.local", password });
  // One generic message for "no such user" and "wrong password" so the form can't be used to discover accounts.

  if (error || !row) return { error: "Incorrect username or password. If HR created your account, use the temporary password they gave you." };

  redirect(row.role === "admin" ? "/admin/dashboard" : row.profile_complete ? "/employee/home" : "/employee/setup");
}
