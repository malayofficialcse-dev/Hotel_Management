"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.register({
        name,
        email,
        phone,
        password,
      });

      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push("/");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create your account. Please try again.");
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
            <strong className="font-semibold block mb-0.5">Booking Account Setup</strong>
            Create your account in 30 seconds to proceed with and confirm your stay reservation.
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xl shadow-stone-200/50">
        <div className="bg-gradient-to-br from-[#1b3d36] to-[#2c5348] p-8 text-white text-center relative">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-3">
            <FigmaIcon name="heart" className="h-6 w-6 text-emerald-300" />
          </div>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-300/90">
            Join the Community
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-white">Create StayEase Account</h1>
          <p className="mt-2 text-xs text-emerald-100/80 max-w-xs mx-auto">
            Enjoy member discounts, seamless check-ins, and flexible cancellation on select properties.
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
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Malay Maity"
              className="w-full h-11 rounded-lg border border-stone-300 px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address *
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
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full h-11 rounded-lg border border-stone-300 px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full h-11 rounded-lg border border-stone-300 px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-lg bg-forest hover:bg-[#385346] text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? "Creating your account…" : "Register & Complete"}
          </button>

          <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
            Already have an account?{" "}
            <Link
              href={returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/login"}
              className="font-semibold text-forest hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-stone-500">
        Administrator or hotel employee?{" "}
        <Link href="/admin/login" className="font-medium text-stone-700 hover:text-forest underline">
          Go to Admin Portal
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-200px)] bg-[#f7f5f2] py-14 px-4 flex items-center justify-center">
        <Suspense fallback={<div className="text-center text-sm text-stone-500">Loading registration…</div>}>
          <RegisterForm />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
