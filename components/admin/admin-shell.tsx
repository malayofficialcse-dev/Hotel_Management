"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { adminNavigation, type AdminSection } from "./admin-data";

const icons: Record<AdminSection, string> = {
  dashboard: "▦",
  hotels: "⌂",
  rooms: "▤",
  reservations: "▣",
  customers: "♙",
  departments: "♧",
  employees: "♙",
  roles: "⛨",
  payments: "▱",
  offers: "◇",
  reviews: "☆",
  reports: "▥",
  notifications: "♧",
  audit: "◷",
  settings: "⚙",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = pathname.split("/")[2] || "dashboard";

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">S</span>
          <span>StayEase</span>
        </Link>
        <div className="admin-side-caption">PORTFOLIO WORKSPACE</div>
        <div className="admin-property-picker">
          <span className="admin-property-avatar">A</span>
          <span><strong>All 6 properties</strong><small>Portfolio workspace</small></span>
          <span className="admin-picker-arrow">⌄</span>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {adminNavigation.map((item) => (
            <div key={item.id}>
              {item.group && <div className="admin-nav-group">{item.group}</div>}
              <Link
                href={item.id === "dashboard" ? "/admin" : `/admin/${item.id}`}
                className={`admin-nav-link ${current === item.id ? "is-active" : ""}`}
                aria-current={current === item.id ? "page" : undefined}
              >
                <span className="admin-nav-icon" aria-hidden="true">{icons[item.id]}</span>
                <span>{item.label}</span>
                {item.id === "notifications" && <span className="admin-nav-count">2</span>}
              </Link>
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note"><span className="admin-online-dot" /> All systems operational</div>
          <Link href="/" className="admin-customer-link">← View customer website</Link>
          <div className="admin-user">
            <span className="admin-user-avatar">AM</span>
            <span><strong>Aarav Mehta</strong><small>Workspace administrator</small></span>
            <span className="admin-picker-arrow">···</span>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Workspace</span><span className="admin-crumb-sep">/</span><strong>All 6 properties</strong></div>
          <div className="admin-top-actions">
            <button type="button" className="admin-search-global" aria-label="Search workspace">⌕ <span>Search anything...</span><kbd>⌘ K</kbd></button>
            <button type="button" className="admin-icon-button" aria-label="Help">?</button>
            <button type="button" className="admin-icon-button admin-bell" aria-label="Notifications">♧<i /></button>
            <span className="admin-top-avatar">AM</span>
          </div>
        </header>
        <main className="admin-content">{children}</main>
        <footer className="admin-footer"><span>StayEase Admin · All times in property local time</span><span>Privacy&nbsp;&nbsp; · &nbsp;&nbsp;Help centre</span></footer>
      </div>
    </div>
  );
}

