"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FigmaIcon } from "@/components/figma-icon";
import { api, type UserSession } from "@/lib/api-client";

type SiteHeaderProps = {
  active?: "explore" | "bookings" | "wishlist";
};

const navItems = [
  { label: "Explore", href: "/", id: "explore" },
  { label: "Offers", href: "/#offers", id: "offers" },
  { label: "My Bookings", href: "/bookings", id: "bookings" },
  { label: "Wishlist", href: "/wishlist", id: "wishlist" },
] as const;

export function SiteHeader({ active = "explore" }: SiteHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(api.getUser());
  }, []);

  function handleLogout() {
    api.logout();
    setUser(null);
    router.refresh();
  }

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "G";

  return (
      <header className="border-b border-line bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-[88px] max-w-[1296px] items-center justify-between px-5 lg:px-0">
          <Link href="/" className="flex items-center gap-[9px]" aria-label="StayEase home">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-mint">
              <FigmaIcon name="bed" className="h-[20px] w-[20px]" />
            </span>
            <span className="text-[25px] font-bold tracking-[-1px] text-ink">StayEase</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const selected = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`border-b-2 py-[35px] text-[13px] transition-colors ${selected
                      ? "border-forest font-semibold text-forest"
                      : "border-transparent text-muted hover:text-ink"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-xs text-ink">
              <button type="button" className="hidden sm:block text-muted hover:text-ink">
                INR ₹
              </button>
              <button type="button" aria-label="Notifications" className="hidden sm:block text-muted hover:text-ink">
                <FigmaIcon name="bell" className="h-[17px] w-[17px]" />
              </button>

              {user ? (
                <div className="flex items-center gap-2 pl-2">
                  <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-mint text-[11px] font-semibold text-forest border border-forest/20">
                    {initials}
                  </span>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-semibold text-xs text-ink leading-tight">{user.name}</span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-[10px] text-muted hover:text-red-700 text-left transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="rounded-[4px] px-3 py-1.5 text-xs font-semibold text-ink hover:text-forest transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-[4px] bg-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#385346] transition-colors shadow-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}
          </div>
        </div>
        <nav className="flex items-center justify-center gap-6 border-t border-line px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <Link key={item.id} className="text-xs text-muted" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      );
}
