"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api, type AdminDepartment, type AdminEmployee, type AdminHotel, type AdminRoom, type HousekeepingTask } from "@/lib/api-client";
import { FigmaIcon } from "@/components/figma-icon";
import { adminNavigation, type AdminSection } from "./admin-data";

type SearchItem = { label: string; detail: string; href: string };

const icons: Record<AdminSection, string> = {
  dashboard: "▦",
  hotels: "⌂",
  rooms: "▤",
  reservations: "▣",
  customers: "♙",
  departments: "♧",
  employees: "♙",
  housekeeping: "♧",
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
  const router = useRouter();
  const current = pathname.split("/")[2] || "dashboard";
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const user = api.getUser();
    if (user) setAdminUser(user);
  }, []);

  function handleLogout() {
    api.logout();
    router.push("/admin/login");
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchErrors, setSearchErrors] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasLoadedSearch, setHasLoadedSearch] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    searchInput.current?.focus();
    if (hasLoadedSearch) return;

    let active = true;
    setSearchLoading(true);
    Promise.allSettled([
      api.getAdminHotels(),
      api.getAdminRooms(),
      api.getAdminDepartments(),
      api.getAdminEmployees(),
      api.getAdminHousekeepingTasks(),
    ]).then(([hotels, rooms, departments, employees, tasks]) => {
      if (!active) return;
      const items: SearchItem[] = [];
      const errors: string[] = [];
      if (hotels.status === "fulfilled") {
        items.push(...hotels.value.map((hotel: AdminHotel) => ({
          label: hotel.name,
          detail: `${hotel.city} · Hotel`,
          href: `/admin/hotels/${encodeURIComponent(hotel.slug || hotel._id)}`,
        })));
      } else errors.push("Hotels");
      if (rooms.status === "fulfilled") {
        items.push(...rooms.value.map((room: AdminRoom) => ({
          label: room.name,
          detail: `${room.hotelId} · Room`,
          href: "/admin/rooms",
        })));
      } else errors.push("Rooms");
      if (departments.status === "fulfilled") {
        items.push(...departments.value.map((department: AdminDepartment) => ({
          label: department.name,
          detail: `${department.hotelId} · Department`,
          href: "/admin/departments",
        })));
      } else errors.push("Departments");
      if (employees.status === "fulfilled") {
        items.push(...employees.value.map((employee: AdminEmployee) => ({
          label: employee.name,
          detail: `${employee.email} · Employee`,
          href: `/admin/employees/${encodeURIComponent(employee.id)}`,
        })));
      } else errors.push("Employees");
      if (tasks.status === "fulfilled") {
        items.push(...tasks.value.map((task: HousekeepingTask) => ({
          label: `Room ${task.roomNumber}`,
          detail: `${task.hotelId} · Housekeeping`,
          href: "/admin/housekeeping",
        })));
      } else errors.push("Housekeeping");

      setSearchItems(items);
      setSearchErrors(errors);
      setHasLoadedSearch(true);
    }).catch((error: unknown) => {
      if (active) {
        console.error("[Admin workspace] search failed", error);
        setSearchErrors(["workspace records"]);
      }
    }).finally(() => {
      if (active) setSearchLoading(false);
    });
    return () => { active = false; };
  }, [searchOpen, hasLoadedSearch]);

  const matchingSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return adminNavigation.filter((item) => !query || item.label.toLowerCase().includes(query));
  }, [searchQuery]);
  const matchingRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return searchItems
      .filter((item) => !query || `${item.label} ${item.detail}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchItems, searchQuery]);

  function navigateFromSearch(href: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  }

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
          <span><strong>All properties</strong><small>Portfolio workspace</small></span>
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
              </Link>
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">Portfolio operations</div>
          <Link href="/" className="admin-customer-link">← View customer website</Link>
          <div className="admin-user" style={{ cursor: "pointer" }} onClick={handleLogout} title="Click to log out">
            <span className="admin-user-avatar">{adminUser?.name?.[0] || "M"}</span>
            <span><strong>{adminUser?.name || "Mala Admin"}</strong><small>{adminUser?.email || "mala@gmail.com"} &middot; Log out</small></span>
            <span className="admin-picker-arrow">⎋</span>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Workspace</span><span className="admin-crumb-sep">/</span><strong>Portfolio</strong></div>
          <div className="admin-top-actions">
            <button type="button" className="admin-search-global" aria-label="Search workspace" onClick={() => setSearchOpen(true)}>⌕ <span>Search anything...</span><kbd>⌘ K</kbd></button>
            <button type="button" className="admin-icon-button" aria-label="Help">?</button>
            <button type="button" className="admin-icon-button admin-bell" aria-label="Open notifications" onClick={() => router.push("/admin/notifications")}>
              <FigmaIcon name="bell" className="h-4 w-4" />
            </button>
            <button type="button" onClick={handleLogout} className="admin-secondary-button" style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}>Log out</button>
            <span className="admin-top-avatar" title={`Signed in as ${adminUser?.name || "Admin"}`}>{adminUser?.name?.[0] || "M"}</span>
          </div>
        </header>
        <main className="admin-content">{children}</main>
        <footer className="admin-footer"><span>StayEase Admin · All times in property local time</span><span>Privacy&nbsp;&nbsp; · &nbsp;&nbsp;Help centre</span></footer>
      </div>
      {searchOpen && (
        <div className="admin-command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <section className="admin-command-dialog" role="dialog" aria-modal="true" aria-label="Search workspace">
            <div className="admin-command-input">⌕
              <input
                ref={searchInput}
                aria-label="Search workspace"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pages, hotels, rooms, and teams"
              />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">Esc</button>
            </div>
            {searchLoading && <p className="admin-command-message">Loading workspace records…</p>}
            {searchErrors.length > 0 && (
              <p className="admin-command-error" role="status">
                Some services could not be searched: {searchErrors.join(", ")}.
                <button type="button" onClick={() => { setHasLoadedSearch(false); setSearchErrors([]); setSearchItems([]); }}>Retry</button>
              </p>
            )}
            {!searchLoading && (
              <div className="admin-command-results">
                {matchingSections.length > 0 && (
                  <div>
                    <p className="admin-command-heading">Pages</p>
                    {matchingSections.slice(0, 5).map((item) => (
                      <button key={item.id} type="button" onClick={() => navigateFromSearch(item.id === "dashboard" ? "/admin" : `/admin/${item.id}`)}>
                        <span>{icons[item.id]}</span><strong>{item.label}</strong><small>Workspace page</small>
                      </button>
                    ))}
                  </div>
                )}
                {matchingRecords.length > 0 && (
                  <div>
                    <p className="admin-command-heading">Records</p>
                    {matchingRecords.map((item, index) => (
                      <button key={`${item.href}-${item.label}-${index}`} type="button" onClick={() => navigateFromSearch(item.href)}>
                        <span>⌕</span><strong>{item.label}</strong><small>{item.detail}</small>
                      </button>
                    ))}
                  </div>
                )}
                {matchingSections.length === 0 && matchingRecords.length === 0 && (
                  <p className="admin-command-message">{searchQuery ? "No matching pages or records." : "Type to search workspace pages and records."}</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

