import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-mist">
      <div className="mx-auto flex max-w-[1296px] flex-col gap-6 px-5 py-8 text-xs text-muted lg:px-0">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <Link href="/" className="text-lg font-semibold text-ink">StayEase</Link>
            <p className="mt-2">Beautiful stays. Effortless getaways.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigation">
            <a href="#about">About us</a>
            <a href="#help">Help centre</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms of use</a>
          </nav>
        </div>
        <div className="flex flex-col justify-between gap-2 text-[11px] sm:flex-row">
          <span>© 2026 StayEase. All rights reserved.</span>
          <span>Made for your next great escape.</span>
        </div>
      </div>
    </footer>
  );
}
