"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FigmaIcon } from "@/components/figma-icon";
import { api, type UserNotification, type UserSession } from "@/lib/api-client";

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
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setUser(api.getUser());
    };
    syncUser();
    window.addEventListener("stayease-user-updated", syncUser);
    return () => window.removeEventListener("stayease-user-updated", syncUser);
  }, []);

  useEffect(() => {
    if (!user || !api.getToken()) { setNotifications([]); return; }
    let active = true;
    let notificationsRouteMissing = false;
    const syncNotifications = async () => {
      if (!active || notificationsRouteMissing) return;
      try {
        const rows = await api.getMyNotifications();
        if (active) setNotifications(rows);
      } catch (error) {
        // An older running booking-service may not have the notifications route yet.
        // Stop hammering that known-missing route until the page is reloaded after deployment.
        if (error instanceof Error && error.message.includes("(404)")) notificationsRouteMissing = true;
      }
    };
    void syncNotifications();
    const timer = window.setInterval(() => void syncNotifications(), 5000);
    window.addEventListener("focus", syncNotifications);
    window.addEventListener("stayease-reservations-updated", syncNotifications);
    const handleStorage = (event: StorageEvent) => { if (event.key === "stayease-reservations-updated-at") void syncNotifications(); };
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", syncNotifications);
      window.removeEventListener("stayease-reservations-updated", syncNotifications);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user]);

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
      <div className="mx-auto flex h-[76px] max-w-[1760px] items-center justify-between px-4 sm:px-6 lg:px-10 2xl:px-14">
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
                className={`border-b-2 py-[29px] text-[13px] transition-colors ${selected
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
          {user && <div className="relative hidden sm:block">
            <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className="relative text-muted hover:text-ink">
              <FigmaIcon name="bell" className="h-[17px] w-[17px]" />
              {notifications.some((item) => !item.readAt) && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[9px] font-bold text-white">{notifications.filter((item) => !item.readAt).length}</span>}
            </button>
            {notificationsOpen && <div className="absolute right-0 top-8 z-50 w-[min(360px,90vw)] overflow-hidden rounded-lg border border-line bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-4 py-3"><strong className="text-xs">Notifications</strong><button type="button" onClick={() => setNotificationsOpen(false)} className="text-[10px] text-muted hover:text-forest">Close</button></div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length ? notifications.map((item) => <button key={item.id} type="button" onClick={async () => { if (!item.readAt) { await api.markNotificationRead(item.id).catch(() => undefined); setNotifications((rows) => rows.map((row) => row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row)); } setNotificationsOpen(false); router.push("/bookings"); }} className={`block w-full border-b border-line px-4 py-3 text-left hover:bg-mist ${item.readAt ? "bg-white" : "bg-mint/30"}`}>
                  <span className="block text-xs font-semibold text-charcoal">{item.title}</span><span className="mt-1 block text-[10px] leading-4 text-muted">{item.message}</span><span className="mt-1 block text-[9px] text-muted">{new Date(item.createdAt).toLocaleString("en-IN")}</span>
                </button>) : <p className="px-4 py-6 text-center text-xs text-muted">You’re all caught up.</p>}
              </div>
            </div>}
          </div>}

          {user ? (
            <div className="flex items-center gap-2 pl-2">
              <Link
                href="/account"
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-mint text-[11px] font-semibold text-forest border border-forest/20 hover:ring-2 hover:ring-forest/30 transition-all cursor-pointer"
                title="View and update profile"
              >
                {initials}
              </Link>
              <div className="hidden sm:flex flex-col text-left">
                <Link
                  href="/account"
                  className="font-semibold text-xs text-ink leading-tight hover:text-forest transition-colors"
                  title="View and update profile"
                >
                  {user.name}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Link
                    href="/account"
                    className="text-[10px] text-forest font-medium hover:underline"
                  >
                    Profile
                  </Link>
                  <span className="text-[10px] text-muted">·</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[10px] text-muted hover:text-red-700 text-left transition-colors"
                  >
                    Sign out
                  </button>
                </div>
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
