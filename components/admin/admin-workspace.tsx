"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { hotels } from "@/lib/data";
import {
  sectionRecords,
  sectionTabs,
  sectionTitles,
  statCards,
  type AdminRecord,
  type AdminSection,
} from "./admin-data";

const chartValues = [31, 47, 42, 59, 52, 70, 61, 82, 72, 90, 77, 100];
const formatNumber = (value: number) => value.toLocaleString("en-IN");

export function AdminWorkspace({ section }: { section: AdminSection }) {
  const [records, setRecords] = useState<AdminRecord[]>(sectionRecords[section] ?? []);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(sectionTabs[section]?.[0] ?? "Overview");
  const [notice, setNotice] = useState("");
  const [period, setPeriod] = useState("Last 30 days");
  const content = sectionTitles[section];
  const filtered = useMemo(
    () => records.filter((row) => `${row.id} ${row.name} ${row.detail} ${row.status}`.toLowerCase().includes(query.toLowerCase())),
    [records, query],
  );

  function onAction() {
    if (section === "settings") {
      setNotice("Workspace settings saved.");
    } else if (section === "notifications") {
      setRecords((rows) => rows.map((row) => ({ ...row, status: "Read" })));
      setNotice("All notifications marked as read.");
    } else if (section === "payments" || section === "reports" || section === "audit") {
      setNotice(`${content.title} export is ready.`);
    } else if (section === "reviews") {
      setTab("Needs reply");
    } else {
      const newRow: AdminRecord = {
        id: `${section.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-5)}`,
        name: `New ${section === "hotels" ? "property" : section.slice(0, -1)}`,
        detail: "Draft · Complete setup to publish",
        status: "Draft",
        value: "—",
        date: "Just now",
      };
      setRecords((rows) => [newRow, ...rows]);
      setNotice(`New ${section === "hotels" ? "property" : section.slice(0, -1)} draft created.`);
    }
  }

  if (section === "dashboard") {
    return <Dashboard onPeriodChange={setPeriod} period={period} />;
  }

  if (section === "settings") {
    return (
      <>
        <PageHeader section={section} notice={notice} onAction={onAction} />
        <Stats section={section} />
        <div className="admin-settings-grid">
          <section className="admin-panel admin-settings-panel">
            <h2>Workspace details</h2><p className="admin-panel-subtitle">Manage the details used across your portfolio.</p>
            <div className="admin-form-grid">
              <label>Workspace name<input defaultValue="StayEase" /></label>
              <label>Default currency<select defaultValue="INR — Indian Rupee"><option>INR — Indian Rupee</option><option>USD — US Dollar</option></select></label>
              <label>Timezone<select defaultValue="Asia/Kolkata (IST)"><option>Asia/Kolkata (IST)</option><option>Asia/Dubai (GST)</option></select></label>
              <label>Language<select defaultValue="English"><option>English</option><option>Hindi</option></select></label>
            </div>
            <h2 className="admin-settings-heading">Guest communications</h2>
            <ToggleRow title="Reservation confirmations" detail="Send an email when a booking is confirmed." />
            <ToggleRow title="Payment updates" detail="Notify guests when a payment is settled or refunded." />
            <ToggleRow title="Review reminders" detail="Invite guests to share feedback after checkout." />
          </section>
          <section className="admin-panel admin-settings-panel">
            <h2>Workspace preferences</h2><p className="admin-panel-subtitle">A few defaults for your team.</p>
            <ToggleRow title="Require manager approval" detail="For reservations with special requests." />
            <ToggleRow title="Show guest phone numbers" detail="Limit visibility to authorized staff." />
            <ToggleRow title="Two-step sign-in" detail="Add an extra layer of account security." />
            <div className="admin-info-card"><span>✓</span><div><strong>All systems operational</strong><p>Your workspace and connected properties are up to date.</p></div></div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader section={section} notice={notice} onAction={onAction} />
      <Stats section={section} />
      {section === "hotels" && <PropertyStrip />}
      {section === "reports" && <ReportsChart period={period} onPeriodChange={setPeriod} />}
      {section === "roles" && <RoleNotice />}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div><h2>{section === "reservations" ? "All reservations" : `All ${content.title.toLowerCase()}`}</h2><p>{filtered.length} records · Portfolio totals in INR</p></div>
          <button type="button" className="admin-filter-button" onClick={() => setNotice("Showing all active records.")}>☷ <span>Filters</span></button>
        </div>
        {sectionTabs[section] && (
          <div className="admin-tabs" role="tablist" aria-label={`${content.title} views`}>
            {sectionTabs[section]?.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "is-selected" : ""} onClick={() => setTab(item)}>{item}</button>)}
          </div>
        )}
        <div className="admin-table-tools">
          <label className="admin-table-search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${content.title.toLowerCase()}...`} /></label>
          <button type="button" className="admin-select-button">All properties⌄</button>
          <button type="button" className="admin-select-button">Oct 31 – Nov 7⌄</button>
          <button type="button" className="admin-select-button">All statuses⌄</button>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th><input type="checkbox" aria-label="Select all rows" /></th><th>{section === "reservations" ? "BOOKING ID" : "ID"}</th><th>{section === "customers" || section === "employees" ? "GUEST / TEAM MEMBER" : "NAME"}</th><th>DETAILS</th><th>STATUS</th><th>{section === "hotels" ? "RATING" : "VALUE"}</th><th>UPDATED</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{filtered.map((row) => (
              <tr key={row.id}>
                <td><input type="checkbox" aria-label={`Select ${row.name}`} /></td>
                <td className="admin-id">{row.id}</td>
                <td><strong className="admin-row-name">
                  {section === "employees" || section === "roles"
                    ? <Link className="admin-row-detail-link" href={`/admin/${section}/${encodeURIComponent(row.id)}`}>{row.name}</Link>
                    : row.name}
                </strong></td>
                <td className="admin-detail-cell">{row.detail}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className="admin-value-cell">{row.value}</td>
                <td className="admin-date-cell">{row.date}</td>
                <td><button className="admin-row-menu" type="button" aria-label={`Actions for ${row.name}`} onClick={() => setNotice(`Selected ${row.name}.`)}>···</button></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <div className="admin-empty">No records match “{query}”. Try a different search.</div>}
        </div>
        <div className="admin-table-foot"><span>Showing {filtered.length ? 1 : 0}–{filtered.length} of {formatNumber(filtered.length)} properties · Portfolio totals in INR</span><div><span>Page 1 of 1</span><button type="button" aria-label="Previous page" disabled>‹</button><button type="button" aria-label="Next page" disabled>›</button></div></div>
      </section>
      {section === "hotels" && <div className="admin-footnote">StayEase Admin · All times in property local time</div>}
    </>
  );
}

function PageHeader({ section, notice, onAction }: { section: AdminSection; notice: string; onAction: () => void }) {
  const content = sectionTitles[section];
  return (
    <div className="admin-page-heading">
      <div><div className="admin-eyebrow">WORKSPACE&nbsp; / &nbsp;{content.title.toUpperCase()}</div><h1>{content.title}</h1><p>{content.subtitle}</p></div>
      <div className="admin-heading-actions">
        <button type="button" className="admin-secondary-button" onClick={() => window.print()}>↓ <span>Export</span></button>
        <button type="button" className="admin-primary-button" onClick={onAction}>＋ {content.action}</button>
        {notice && <span className="admin-action-notice" role="status">{notice}</span>}
      </div>
    </div>
  );
}

function Stats({ section }: { section: AdminSection }) {
  return <div className="admin-stats-grid">{statCards[section].map((stat, index) => <div key={stat.label} className="admin-stat-card"><div className="admin-stat-top"><span>{stat.label}</span><span className={`admin-stat-icon tone-${index % 4}`}>{["↗", "⌂", "▤", "◷"][index % 4]}</span></div><strong>{stat.value}</strong><small>{stat.note}</small></div>)}</div>;
}

function Dashboard({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  const [notice, setNotice] = useState("");
  const upcoming = sectionRecords.reservations?.slice(0, 4) ?? [];
  return (
    <>
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow">TUESDAY, NOVEMBER 10, 2026&nbsp; · &nbsp;ALL PROPERTIES</div><h1>A good day starts with a clear view.</h1><p>Here’s what’s happening across your portfolio today.</p></div>
        <div className="admin-heading-actions"><select aria-label="Dashboard date range" value={period} onChange={(event) => onPeriodChange(event.target.value)} className="admin-period-select"><option>Last 30 days</option><option>This month</option><option>This year</option></select><button type="button" className="admin-primary-button" onClick={() => setNotice("Your dashboard report is ready to export.")}>↓ &nbsp;Export report</button></div>
      </div>
      {notice && <div className="admin-inline-notice" role="status">{notice}</div>}
      <Stats section="dashboard" />
      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-heading"><div><h2>Revenue overview</h2><p>Portfolio performance · {period.toLowerCase()}</p></div><button type="button" className="admin-filter-button" onClick={() => setNotice("Revenue chart is showing portfolio totals.")}>Monthly⌄</button></div>
          <div className="admin-chart-legend"><span><i /> Revenue</span><span><i /> Last period</span></div>
          <div className="admin-chart">
            <div className="admin-chart-y"><span>₹10L</span><span>₹7.5L</span><span>₹5L</span><span>₹2.5L</span><span>₹0</span></div>
            <div className="admin-chart-plot"><div className="admin-chart-gridlines"><i /><i /><i /><i /><i /></div><div className="admin-chart-bars">{chartValues.map((value, index) => <div className="admin-chart-column" key={`${value}-${index}`}><span className="admin-chart-bar" style={{ height: `${value}%` }} /><span className="admin-chart-month">{["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][index % 6]}</span></div>)}</div></div>
          </div>
          <div className="admin-chart-total"><strong>₹89,42,000</strong><span>↑ 8.2% compared to previous period</span></div>
        </section>
        <section className="admin-panel admin-occupancy-panel">
          <div className="admin-panel-heading"><div><h2>Occupancy by property</h2><p>Today across your portfolio</p></div><button type="button" className="admin-mini-link">View all →</button></div>
          {hotels.slice(0, 5).map((hotel, index) => <div className="admin-occupancy-row" key={hotel.id}><span>{hotel.name}</span><div className="admin-progress-track"><i style={{ width: `${[78, 64, 92, 56, 83][index]}%` }} /></div><strong>{[78, 64, 92, 56, 83][index]}%</strong></div>)}
        </section>
        <section className="admin-panel admin-dashboard-table">
          <div className="admin-panel-heading"><div><h2>Recent reservations</h2><p>The latest activity across your properties</p></div><Link href="/admin/reservations" className="admin-mini-link">View all →</Link></div>
          <div className="admin-compact-rows">{upcoming.map((row) => <div className="admin-compact-row" key={row.id}><span className="admin-row-avatar">{row.name.split(" ").map((part) => part[0]).join("")}</span><span className="admin-compact-person"><strong>{row.name}</strong><small>{row.detail}</small></span><StatusBadge status={row.status} /><strong className="admin-compact-price">{row.value}</strong></div>)}</div>
        </section>
        <section className="admin-panel admin-activity-panel">
          <div className="admin-panel-heading"><div><h2>Recent activity</h2><p>Latest updates from your team</p></div><Link href="/admin/audit" className="admin-mini-link">Audit log →</Link></div>
          <Activity title="New reservation received" detail="Aarav Mehta · The Palm House" time="10:42 AM" tone="green" />
          <Activity title="Payment settled" detail="₹14,560 · Haveli & Co." time="9:18 AM" tone="blue" />
          <Activity title="Room marked for maintenance" detail="Deluxe room · The Palm House" time="Yesterday" tone="amber" />
          <Activity title="Guest review published" detail="Maya Kapoor · 5.0 stars" time="Yesterday" tone="purple" />
        </section>
      </div>
      <div className="admin-dashboard-note"><span>ⓘ</span><span>Your portfolio is looking healthy. <strong>78.5% occupancy</strong> and a <strong>4.8 guest rating</strong> are both up this month.</span><Link href="/admin/reports">Explore portfolio insights →</Link></div>
    </>
  );
}

function Activity({ title, detail, time, tone }: { title: string; detail: string; time: string; tone: string }) {
  return <div className="admin-activity-row"><span className={`admin-activity-icon ${tone}`}>•</span><span><strong>{title}</strong><small>{detail}</small></span><time>{time}</time></div>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = /active|confirmed|paid|available|published|completed|checked in/i.test(status) ? "green" : /pending|scheduled|reply|occupied|unread/i.test(status) ? "amber" : /cancel|refund|maintenance|flagged|leave|expired/i.test(status) ? "rose" : "gray";
  return <span className={`admin-status status-${tone}`}><i />{status}</span>;
}

function PropertyStrip() {
  return <div className="admin-property-strip">{hotels.slice(0, 3).map((hotel) => <Link href={`/admin/hotels/${hotel.id}`} key={hotel.id} className="admin-property-card"><div className="admin-property-image" style={{ backgroundImage: `url("${hotel.image}")` }} /><div className="admin-property-meta"><span><strong>{hotel.name}</strong><small>{hotel.location}</small></span><StatusBadge status="Active" /></div></Link>)}</div>;
}

function ReportsChart({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  return <section className="admin-panel admin-report-panel"><div className="admin-panel-heading"><div><h2>Portfolio performance</h2><p>Revenue trend across all properties</p></div><select className="admin-period-select" value={period} onChange={(event) => onPeriodChange(event.target.value)}><option>Last 30 days</option><option>This month</option><option>This year</option></select></div><div className="admin-report-bars">{chartValues.map((value, index) => <div key={`${value}-${index}`}><i style={{ height: `${value}%` }} /><span>{["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][index % 6]}</span></div>)}</div></section>;
}

function RoleNotice() {
  return <div className="admin-inline-notice"><span>⛨</span><span><strong>Access is permission-based.</strong> Team members only see the properties and tools assigned to their role.</span><Link href="/admin/settings">Manage access</Link></div>;
}

function ToggleRow({ title, detail }: { title: string; detail: string }) {
  const [enabled, setEnabled] = useState(true);
  return <div className="admin-toggle-row"><div><strong>{title}</strong><p>{detail}</p></div><button type="button" role="switch" aria-checked={enabled} aria-label={title} className={`admin-switch ${enabled ? "is-on" : ""}`} onClick={() => setEnabled(!enabled)}><i /></button></div>;
}
