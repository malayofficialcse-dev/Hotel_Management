import Link from "next/link";
import { FigmaIcon } from "@/components/figma-icon";

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
  return (
    <header className="border-b border-line bg-white">
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
                className={`border-b-2 py-[35px] text-[13px] transition-colors ${
                  selected
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
          <button type="button" className="hidden sm:block">INR ₹</button>
          <button type="button" aria-label="Notifications" className="hidden sm:block">
            <FigmaIcon name="bell" className="h-[17px] w-[17px]" />
          </button>
          <Link href="/account" className="flex items-center gap-2">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-lilac text-[11px] font-semibold">
              AM
            </span>
            <span className="hidden font-semibold sm:block">Aarav</span>
            <FigmaIcon name="chevron" className="hidden h-3 w-3 sm:block" />
          </Link>
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
