import Link from "next/link";
import { Suspense } from "react";
import { UpdatePasswordForm } from "./update-password-form";

export default function UpdatePasswordPage() {
  return <main className="shell"><Link className="updated" href="/commissioner/login">← Commissioner sign in</Link><section className="card form-card" style={{ marginTop: 18 }}><p className="eyebrow">Commissioner portal</p><h1 style={{ fontSize: "2.6rem" }}>Set a new password</h1><p className="lede">Choose a new password for your commissioner account.</p><Suspense fallback={<p className="updated">Loading password reset…</p>}><UpdatePasswordForm /></Suspense></section></main>;
}
