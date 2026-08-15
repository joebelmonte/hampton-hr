import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/commissioner/transactions";
  return <main className="shell"><Link className="updated" href="/">← Home</Link><section className="card form-card" style={{marginTop: 18}}><p className="eyebrow">Commissioner portal</p><h1 style={{fontSize:"2.6rem"}}>Sign in</h1><p className="lede">Use your commissioner email and password.</p><LoginForm next={safeNext} /><p className="updated">Only addresses listed in COMMISSIONER_EMAILS can use commissioner tools.</p></section></main>;
}
