"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.login({ email, password });
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push("/");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {returnUrl && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200/80 p-4 text-xs text-emerald-900 shadow-sm flex items-start gap-3">
          <span className="text-emerald-700 text-base">ⓘ</span>
          <div>
            <strong className="font-semibold block mb-0.5">Reservation in Progress</strong>
            Please sign in to your StayEase account to finalize and confirm your room booking.
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xl shadow-stone-200/50">
        <div className="bg-gradient-to-br from-[#1b3d36] to-[#2c5348] p-8 text-white text-center relative">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-3">
            <FigmaIcon name="bed" className="h-6 w-6 text-emerald-300" />
          </div>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-300/90">
            Guest Experience
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-white">Welcome to StayEase</h1>
          <p className="mt-2 text-xs text-emerald-100/80 max-w-xs mx-auto">
            Access your bookings, saved boutique stays, and special retreat offers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full h-11 rounded-lg border border-stone-300 px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-lg border border-stone-300 px-3.5 pr-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 text-xs font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-lg bg-forest hover:bg-[#385346] text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In to StayEase"}
          </button>

          <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
            Don&apos;t have an account yet?{" "}
            <Link
              href={returnUrl ? `/auth/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/register"}
              className="font-semibold text-forest hover:underline"
            >
              Create free guest account
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-stone-500">
        Hotel staff or workspace manager?{" "}
        <Link href="/admin/login" className="font-medium text-stone-700 hover:text-forest underline">
          Administrator Console
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-200px)] bg-[#f7f5f2] py-14 px-4 flex items-center justify-center">
        <Suspense fallback={<div className="text-center text-sm text-stone-500">Loading sign in…</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
