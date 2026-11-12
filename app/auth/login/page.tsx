"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button, PageHeading, Surface, TextField } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); try { await api.login({ email: String(form.get("email")), password: String(form.get("password")) }); router.push("/"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in."); } finally { setLoading(false); } }
  return <main className="mx-auto max-w-md px-5 py-16"><PageHeading eyebrow="WELCOME BACK" title="Your next stay starts here." description="Sign in to manage bookings, saved stays, and your preferences." /><Surface className="mt-6 p-5"><form onSubmit={submit}><TextField name="email" label="Email address" type="email" required /><TextField name="password" label="Password" type="password" required className="mt-3" />{error && <p role="alert" className="mt-3 rounded bg-blush p-3 text-xs text-red-800">{error}</p>}<Button type="submit" disabled={loading} className="mt-5 w-full">{loading ? "Signing in…" : "Sign in"}</Button></form><p className="mt-5 text-center text-xs text-muted">New to StayEase? <Link className="font-semibold text-forest" href="/auth/register">Create an account</Link></p></Surface></main>;
}
