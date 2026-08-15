"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  async function signIn(formData: FormData) {
    setPending(true);
    setMessage(undefined);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) setMessage(error.message);
    else window.location.assign(next);
  }
  async function resetPassword(formData: FormData) {
    setPending(true);
    setMessage(undefined);
    const email = String(formData.get("email") ?? "").trim();
    const redirectTo = new URL("/auth/update-password", window.location.origin).toString();
    const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo });
    setPending(false);
    setMessage(error ? error.message : "Check your email for a password-reset link.");
  }
  return resetting ? <form action={resetPassword}><label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><button className="button" type="submit" disabled={pending}>{pending ? "Sending…" : "Email reset link"}</button><button className="link-button" type="button" onClick={() => { setResetting(false); setMessage(undefined); }}>Back to sign in</button>{message && <p className="updated" role="status">{message}</p>}</form> : <form action={signIn}><label>Email<input name="email" type="email" autoComplete="username" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="button" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button><button className="link-button" type="button" onClick={() => { setResetting(true); setMessage(undefined); }}>Forgot password?</button>{message && <p className="updated" role="status">{message}</p>}</form>;
}
