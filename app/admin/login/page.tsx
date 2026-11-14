"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("mala@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in as admin, redirect to admin dashboard
    const user = api.getUser();
    const token = api.getToken();
    if (token && user && user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      if (response.user.role !== "ADMIN") {
        api.logout();
        setError("Access restricted: Only system administrators are authorized to access this console.");
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1614] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-tr from-[#1b3d36] to-[#2e6b5e] border border-emerald-500/30 shadow-2xl mb-4">
          <span className="text-2xl font-bold tracking-tight text-emerald-400">S</span>
        </div>
        <div className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 rounded-full mb-3">
          Staff &amp; Executive Console
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">StayEase Admin Portal</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Enter administrative credentials to manage portfolio reservations, rooms, and hotel staff.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#142320]/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-emerald-900/40 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-950/60 border border-red-800/50 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
                <span className="text-red-400 font-bold">✕</span>
                <span className="flex-1 leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                Administrator Email
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg bg-[#0a1210] border border-zinc-700/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="admin@stayease.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                  Password
                </label>
              </div>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg bg-[#0a1210] border border-zinc-700/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/30 p-3 text-[11px] text-emerald-300/80">
              <span className="font-semibold text-emerald-300">Admin Account:</span> <code className="text-white">mala@gmail.com</code> &middot; Pass: <code className="text-white">123456</code>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Authenticating console…" : "Authorize & Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              &larr; Return to guest site
            </Link>
            <Link href="/auth/login" className="hover:text-emerald-400 transition-colors">
              Customer Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

