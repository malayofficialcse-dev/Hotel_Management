"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button, PageHeading, Surface, TextField } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); try { await api.register({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")), phone: String(form.get("phone") || "") }); router.push("/"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to create your account."); } finally { setLoading(false); } }
  return <main className="mx-auto max-w-md px-5 py-16"><PageHeading eyebrow="JOIN STAYEASE" title="Make room for more good trips." description="Create an account to keep your stays, details, and offers together." /><Surface className="mt-6 p-5"><form onSubmit={submit}><TextField name="name" label="Full name" required /><TextField name="email" label="Email address" type="email" required className="mt-3" /><TextField name="phone" label="Phone number" type="tel" className="mt-3" /><TextField name="password" label="Password" type="password" required minLength={8} className="mt-3" />{error && <p role="alert" className="mt-3 rounded bg-blush p-3 text-xs text-red-800">{error}</p>}<Button type="submit" disabled={loading} className="mt-5 w-full">{loading ? "Creating account…" : "Create account"}</Button></form><p className="mt-5 text-center text-xs text-muted">Already a member? <Link className="font-semibold text-forest" href="/auth/login">Sign in</Link></p></Surface></main>;
}
