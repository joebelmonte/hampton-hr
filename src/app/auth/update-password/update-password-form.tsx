"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = createSupabaseBrowserClient();
    async function establishRecoverySession() {
      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.getSession().then(({ error }) => ({ error }));
      if (error) setMessage("This password-reset link is invalid or expired. Request a new one from the sign-in page.");
      else setReady(true);
    }
    void establishRecoverySession();
  }, [searchParams]);
  async function updatePassword(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password.length < 8) return setMessage("Use a password with at least 8 characters.");
    if (password !== confirmation) return setMessage("The passwords do not match.");
    setPending(true);
    setMessage(undefined);
    const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
    setPending(false);
    if (error) setMessage(error.message);
    else { setMessage("Password updated. Redirecting to commissioner sign-in…"); window.setTimeout(() => window.location.assign("/commissioner/login"), 900); }
  }
  if (!ready) return <p className="updated" role="status">{message ?? "Verifying your password-reset link…"}</p>;
  return <form action={updatePassword}><label>New password<input name="password" type="password" autoComplete="new-password" required /></label><label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" required /></label><button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Set new password"}</button>{message && <p className="updated" role="status">{message}</p>}</form>;
}
