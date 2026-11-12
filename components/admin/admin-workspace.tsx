"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { hotels } from "@/lib/data";
import { api, type AdminDepartment, type AdminEmployee, type AdminHotel, type AdminRoom, type HousekeepingTask } from "@/lib/api-client";
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

async function loadLiveRecords(section: AdminSection): Promise<AdminRecord[] | null> {
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (section === "hotels") {
    const rows = await api.getAdminHotels();
    return rows.map((hotel: AdminHotel) => ({
      id: hotel.slug || hotel._id,
      name: hotel.name,
      detail: `${hotel.location} · ${hotel.city}`,
      status: hotel.isActive ? "Active" : "Inactive",
      value: `${hotel.rating} / 5`,
      date,
    }));
  }
  if (section === "rooms") {
    const rows = await api.getAdminRooms();
    return rows.map((room: AdminRoom) => ({
      id: room._id,
      name: room.name,
      detail: `${room.hotelId} · ${room.bedType || `${room.capacity} guests`}`,
      status: room.isActive ? "Available" : "Inactive",
      value: `${room.totalInventory} rooms · ₹${room.price.toLocaleString("en-IN")} / night`,
      date,
    }));
  }
  if (section === "departments") {
    const rows = await api.getAdminDepartments();
    return rows.map((department: AdminDepartment) => ({
      id: department._id,
      name: department.name,
      detail: department.description || `Hotel ${department.hotelId}`,
      status: department.isActive ? "Active" : "Inactive",
      value: "Department",
      date,
    }));
  }
  if (section === "employees") {
    const rows = await api.getAdminEmployees();
    return rows.map((employee: AdminEmployee) => ({
      id: employee.id,
      name: employee.name,
      detail: `${employee.department?.name || employee.departmentId} · ${employee.email}`,
      status: employee.isActive ? "Active" : "Inactive",
      value: employee.position,
      date,
    }));
  }
  if (section === "housekeeping") {
    const rows = await api.getAdminHousekeepingTasks();
    return rows.map((task: HousekeepingTask) => ({
      id: task._id,
      name: `Room ${task.roomNumber}`,
      detail: `${task.hotelId} · ${task.taskType || "STANDARD"}`,
      status: task.status.replaceAll("_", " "),
      value: task.assignedTo || "Unassigned",
      date,
    }));
  }
  return null;
}

const createFields: Partial<Record<AdminSection, CreateField[]>> = {
  hotels: [
    { name: "name", label: "Hotel name", required: true },
    { name: "city", label: "City", required: true },
    { name: "location", label: "Location", required: true },
    { name: "category", label: "Category", required: true },
    { name: "basePrice", label: "Base price per night", type: "number", required: true },
  ],
  rooms: [
    { name: "hotelId", label: "Hotel slug / ID", required: true },
    { name: "name", label: "Room name", required: true },
    { name: "price", label: "Price per night", type: "number", required: true },
    { name: "capacity", label: "Guest capacity", type: "number", required: true },
    { name: "totalInventory", label: "Room inventory", type: "number", required: true },
  ],
  departments: [
    { name: "hotelId", label: "Hotel slug / ID", required: true },
    { name: "name", label: "Department name", required: true },
    { name: "description", label: "Description" },
  ],
  employees: [
    {
      name: "userId",
      label: "Auth user ID (UUID)",
      required: true,
      placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
      title: "Enter the UUID of an existing auth user.",
    },
    { name: "departmentId", label: "Department ID", required: true },
    { name: "name", label: "Full name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "position", label: "Position", required: true },
    { name: "joiningDate", label: "Joining date", type: "date", required: true },
  ],
  housekeeping: [
    { name: "hotelId", label: "Hotel slug / ID", required: true },
    { name: "roomNumber", label: "Room number", required: true },
    { name: "taskType", label: "Task type" },
    { name: "assignedTo", label: "Assigned employee ID" },
  ],
};

export function AdminWorkspace({ section }: { section: AdminSection }) {
  const [records, setRecords] = useState<AdminRecord[]>(sectionRecords[section] ?? []);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(sectionTabs[section]?.[0] ?? "Overview");
  const [notice, setNotice] = useState("");
  const [period, setPeriod] = useState("Last 30 days");
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const content = sectionTitles[section];
  const live = ["hotels", "rooms", "departments", "employees", "housekeeping"].includes(section);

  useEffect(() => {
    let active = true;
    setRecords(live ? [] : sectionRecords[section] ?? []);
    if (!live) return () => { active = false; };
    setLoadFailed(false);
    setLoading(true);
    loadLiveRecords(section)
      .then((rows) => {
        if (active && rows) {
          setRecords(rows);
          setLoadFailed(false);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadFailed(true);
          setNotice(error instanceof Error ? `Could not load ${content.title.toLowerCase()}: ${error.message}` : "Could not load records.");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section, live, content.title]);

  const filtered = useMemo(
    () => records.filter((row) => `${row.id} ${row.name} ${row.detail} ${row.status}`.toLowerCase().includes(query.toLowerCase())),
    [records, query],
  );

  function onAction() {
    if (live) {
      setCreateOpen(true);
      setNotice("");
    } else if (section === "settings") {
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

  async function submitCreate(data: Record<string, unknown>) {
    try {
      if (section === "hotels") await api.createHotel(data);
      else if (section === "rooms") await api.createRoom(data);
      else if (section === "departments") await api.createDepartment(data);
      else if (section === "employees") await api.createEmployee(data);
      else if (section === "housekeeping") await api.createHousekeepingTask(data);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not create record: ${error.message}` : "Could not create record.");
      return;
    }

    setCreateOpen(false);
    setNotice("Record created successfully.");
    setLoading(true);
    try {
      const rows = await loadLiveRecords(section);
      if (rows) setRecords(rows);
    } catch (error) {
      setNotice(error instanceof Error ? `Record created, but the list could not be refreshed: ${error.message}` : "Record created, but the list could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }

  async function onRecordAction(row: AdminRecord) {
    if (!live) {
      setNotice(`Selected ${row.name}.`);
      return;
    }

    if (section !== "housekeeping") {
      if (!window.confirm(`Remove ${row.name} from this workspace?`)) return;
      try {
        if (section === "hotels") await api.deleteHotel(row.id);
        else if (section === "rooms") await api.deleteRoom(row.id);
        else if (section === "departments") await api.deleteDepartment(row.id);
        else if (section === "employees") await api.deleteEmployee(row.id);
        setNotice(`${row.name} removed.`);
      } catch (error) {
        setNotice(error instanceof Error ? `Could not remove record: ${error.message}` : "Could not remove record.");
        return;
      }
      try {
        setRecords((await loadLiveRecords(section)) || []);
      } catch (error) {
        setNotice(error instanceof Error ? `Record removed, but the list could not be refreshed: ${error.message}` : "Record removed, but the list could not be refreshed.");
      }
      return;
    }

    const transitions: Record<string, string> = {
      DIRTY: "IN_PROGRESS",
      "IN PROGRESS": "CLEAN",
      CLEAN: "INSPECTED",
      INSPECTED: "DIRTY",
      MAINTENANCE: "DIRTY",
    };
    const nextStatus = transitions[row.status.toUpperCase()];
    if (!nextStatus) return;
    try {
      await api.updateHousekeepingTask(row.id, { status: nextStatus });
      setNotice(`${row.name} marked ${nextStatus.toLowerCase().replaceAll("_", " ")}.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not update task: ${error.message}` : "Could not update task.");
      return;
    }
    try {
      setRecords((await loadLiveRecords(section)) || []);
    } catch (error) {
      setNotice(error instanceof Error ? `Task updated, but the list could not be refreshed: ${error.message}` : "Task updated, but the list could not be refreshed.");
    }
  }

  if (section === "dashboard") {
    return <Dashboard onPeriodChange={setPeriod} period={period} />;
  }

  if (section === "settings") {
    return (
      <>
        <PageHeader section={section} notice={notice} onAction={onAction} />
        <Stats section={section} records={records} unavailable={loadFailed} />
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
      <Stats section={section} records={records} />
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
            <tbody>{loading ? <tr><td colSpan={8}>Loading records…</td></tr> : filtered.map((row) => (
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
                <td><button className="admin-row-menu" type="button" aria-label={`Actions for ${row.name}`} onClick={() => void onRecordAction(row)}>{section === "housekeeping" ? "Update" : live ? "Remove" : "···"}</button></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <div className="admin-empty">No records match “{query}”. Try a different search.</div>}
        </div>
        <div className="admin-table-foot"><span>Showing {filtered.length ? 1 : 0}–{filtered.length} of {formatNumber(filtered.length)} properties · Portfolio totals in INR</span><div><span>Page 1 of 1</span><button type="button" aria-label="Previous page" disabled>‹</button><button type="button" aria-label="Next page" disabled>›</button></div></div>
      </section>
      {section === "hotels" && <div className="admin-footnote">StayEase Admin · All times in property local time</div>}
      {createOpen && (
        <CreateRecordDialog
          section={section}
          fields={createFields[section] || []}
          onClose={() => setCreateOpen(false)}
          onSubmit={(data) => void submitCreate(data)}
        />
      )}
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

function Stats({
  section,
  records,
  cards: suppliedCards,
  unavailable = false,
}: {
  section: AdminSection;
  records?: AdminRecord[];
  cards?: { label: string; value: string; note: string }[];
  unavailable?: boolean;
}) {
  let cards = suppliedCards || statCards[section];
  if (records && ["hotels", "rooms", "departments", "employees", "housekeeping"].includes(section)) {
    const active = records.filter((row) => row.status.toLowerCase() !== "inactive").length;
    if (section === "housekeeping") {
      cards = [
        { label: "Open tasks", value: String(records.filter((row) => row.status !== "INSPECTED").length), note: "Across all properties" },
        { label: "In progress", value: String(records.filter((row) => row.status === "IN PROGRESS").length), note: "Currently being serviced" },
        { label: "Ready for inspection", value: String(records.filter((row) => row.status === "CLEAN").length), note: "Clean rooms awaiting review" },
        { label: "Completed today", value: String(records.filter((row) => row.status === "INSPECTED").length), note: "All properties" },
      ];
    } else {
      cards = [
        { label: `Total ${section}`, value: formatNumber(records.length), note: "Loaded from service" },
        { label: "Active", value: formatNumber(active), note: "Currently enabled" },
        { label: section === "rooms" ? "Room types" : "Records shown", value: formatNumber(records.length), note: "Across your portfolio" },
        { label: "Last synced", value: "Live", note: "Connected to service" },
      ];
    }
    if (unavailable) {
      cards = cards.map((card) => ({ ...card, value: "Unavailable", note: "Service connection failed" }));
    }
  }
  return <div className="admin-stats-grid">{cards.map((stat, index) => <div key={stat.label} className="admin-stat-card"><div className="admin-stat-top"><span>{stat.label}</span><span className={`admin-stat-icon tone-${index % 4}`}>{["↗", "⌂", "▤", "◷"][index % 4]}</span></div><strong>{stat.value}</strong><small>{stat.note}</small></div>)}</div>;
}

type CreateField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  title?: string;
};

function CreateRecordDialog({
  section,
  fields,
  onClose,
  onSubmit,
}: {
  section: AdminSection;
  fields: CreateField[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [lookupOptions, setLookupOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [lookupErrors, setLookupErrors] = useState<string[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  useEffect(() => {
    let active = true;
    const lookups: [string, string, Promise<{ value: string; label: string }[]>][] = [];
    if (["rooms", "departments", "housekeeping"].includes(section)) {
      lookups.push(["hotelId", "hotels", api.getAdminHotels().then((rows) =>
        rows.map((hotel) => ({ value: hotel.slug || hotel._id, label: `${hotel.name} · ${hotel.city}` })),
      )]);
    }
    if (section === "employees") {
      lookups.push(["departmentId", "departments", api.getAdminDepartments().then((rows) =>
        rows.map((department) => ({ value: department._id, label: `${department.name} · ${department.hotelId}` })),
      )]);
    }
    if (section === "housekeeping") {
      lookups.push(["assignedTo", "employees", api.getAdminEmployees().then((rows) =>
        rows.map((employee) => ({ value: employee.id, label: `${employee.name} · ${employee.position}` })),
      )]);
    }
    if (lookups.length === 0) return () => { active = false; };

    setLoadingLookups(true);
    Promise.all(lookups.map(async ([field, label, request]): Promise<
      | { field: string; label: string; options: { value: string; label: string }[] }
      | { field: string; label: string; error: string }
    > => {
      try {
        return { field, label, options: await request };
      } catch (error) {
        return { field, label, error: error instanceof Error ? error.message : "Request failed" };
      }
    })).then((results) => {
      if (!active) return;
      const options: Record<string, { value: string; label: string }[]> = {};
      const errors: string[] = [];
      for (const result of results) {
        if ("options" in result) options[result.field] = result.options;
        else errors.push(`${result.label}: ${result.error}`);
      }
      setLookupOptions(options);
      setLookupErrors(errors);
    }).finally(() => {
      if (active) setLoadingLookups(false);
    });
    return () => { active = false; };
  }, [section]);

  const requiredLookupsReady = fields
    .filter((field) => field.required && ["hotelId", "departmentId"].includes(field.name))
    .every((field) => Boolean(lookupOptions[field.name]?.length));
  const hasRequiredLookups = fields.some((field) => field.required && ["hotelId", "departmentId"].includes(field.name));
  const missingRequiredOptions = fields.some(
    (field) => field.required && ["hotelId", "departmentId"].includes(field.name) && !lookupOptions[field.name]?.length,
  );

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-dialog" onSubmit={(event) => {
        event.preventDefault();
        const data: Record<string, unknown> = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
        for (const field of ["basePrice", "price", "capacity", "totalInventory", "salary"]) {
          if (data[field] !== undefined) data[field] = Number(data[field]);
        }
        onSubmit(data);
      }}>
        <div className="admin-dialog-heading"><div><span className="admin-eyebrow">NEW RECORD</span><h2>{sectionTitles[section].action}</h2></div><button type="button" className="admin-row-menu" aria-label="Close dialog" onClick={onClose}>×</button></div>
        <div className="admin-dialog-fields">
          {fields.map((field) => (
            <label key={field.name}>{field.label}
              {lookupOptions[field.name] ? (
                <select
                  required={field.required}
                  value={values[field.name] || ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                >
                  <option value="">{loadingLookups ? "Loading choices…" : "Select an option"}</option>
                  {lookupOptions[field.name].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input
                  autoComplete="off"
                  required={field.required}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  pattern={field.pattern}
                  title={field.title}
                  value={values[field.name] || (field.name === "category" ? "Beach resorts" : "")}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        {lookupErrors.length > 0 && <p className="admin-dialog-error" role="alert">Could not load record choices: {lookupErrors.join("; ")}. Start the related services and retry.</p>}
        {!loadingLookups && lookupErrors.length === 0 && hasRequiredLookups && missingRequiredOptions &&
          <p className="admin-dialog-error" role="alert">No matching records exist yet. Create the required hotel or department first.</p>}
        {section === "housekeeping" && (
          <label className="admin-dialog-select">Priority
            <select value={values.priority || "NORMAL"} onChange={(event) => setValues((current) => ({ ...current, priority: event.target.value }))}>
              <option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select>
          </label>
        )}
        {section === "employees" && (
          <label className="admin-dialog-select">Salary
            <input type="number" min="0" value={values.salary || ""} onChange={(event) => setValues((current) => ({ ...current, salary: event.target.value }))} />
          </label>
        )}
        <div className="admin-dialog-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="admin-primary-button" disabled={loadingLookups || !requiredLookupsReady}>Save record</button></div>
      </form>
    </div>
  );
}

function Dashboard({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  const [notice, setNotice] = useState("");
  const [overview, setOverview] = useState<{
    hotels: AdminHotel[] | null;
    rooms: AdminRoom[] | null;
    employees: AdminEmployee[] | null;
    tasks: HousekeepingTask[] | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.getAdminHotels(),
      api.getAdminRooms(),
      api.getAdminEmployees(),
      api.getAdminHousekeepingTasks(),
    ]).then(([hotelResult, roomResult, employeeResult, taskResult]) => {
      if (!active) return;
      const failures = [hotelResult, roomResult, employeeResult, taskResult].filter((result) => result.status === "rejected");
      setOverview({
        hotels: hotelResult.status === "fulfilled" ? hotelResult.value : null,
        rooms: roomResult.status === "fulfilled" ? roomResult.value : null,
        employees: employeeResult.status === "fulfilled" ? employeeResult.value : null,
        tasks: taskResult.status === "fulfilled" ? taskResult.value : null,
      });
      if (failures.length) setNotice(`${failures.length} dashboard service${failures.length === 1 ? "" : "s"} could not be reached.`);
    });
    return () => { active = false; };
  }, []);

  const dashboardCards = [
    { label: "Properties", value: overview ? (overview.hotels ? formatNumber(overview.hotels.length) : "Unavailable") : "Loading…", note: overview?.hotels ? `${new Set(overview.hotels.map((hotel) => hotel.city)).size} destinations` : "Hotel service" },
    { label: "Room inventory", value: overview?.rooms ? formatNumber(overview.rooms.reduce((sum, room) => sum + room.totalInventory, 0)) : overview ? "Unavailable" : "Loading…", note: overview?.rooms ? `${overview.rooms.length} room types` : "Room service" },
    { label: "Team members", value: overview?.employees ? formatNumber(overview.employees.length) : overview ? "Unavailable" : "Loading…", note: "Employee service" },
    { label: "Open housekeeping", value: overview?.tasks ? formatNumber(overview.tasks.filter((task) => task.status !== "INSPECTED").length) : overview ? "Unavailable" : "Loading…", note: "Housekeeping service" },
    { label: "Guest rating", value: overview?.hotels?.length ? `${(overview.hotels.reduce((sum, hotel) => sum + hotel.rating, 0) / overview.hotels.length).toFixed(1)} / 5` : overview ? "Unavailable" : "Loading…", note: "Average across active properties" },
    { label: "Active properties", value: overview?.hotels ? formatNumber(overview.hotels.filter((hotel) => hotel.isActive).length) : overview ? "Unavailable" : "Loading…", note: "Hotel catalog" },
  ];
  const upcoming = sectionRecords.reservations?.slice(0, 4) ?? [];
  return (
    <>
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow">TUESDAY, NOVEMBER 10, 2026&nbsp; · &nbsp;ALL PROPERTIES</div><h1>A good day starts with a clear view.</h1><p>Here’s what’s happening across your portfolio today.</p></div>
        <div className="admin-heading-actions"><select aria-label="Dashboard date range" value={period} onChange={(event) => onPeriodChange(event.target.value)} className="admin-period-select"><option>Last 30 days</option><option>This month</option><option>This year</option></select><button type="button" className="admin-primary-button" onClick={() => setNotice("Your dashboard report is ready to export.")}>↓ &nbsp;Export report</button></div>
      </div>
      {notice && <div className="admin-inline-notice" role="status">{notice}</div>}
      <Stats section="dashboard" cards={dashboardCards} />
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
  const tone = /active|confirmed|paid|available|published|completed|checked in|clean|inspected/i.test(status) ? "green" : /pending|scheduled|reply|occupied|unread|in progress/i.test(status) ? "amber" : /cancel|refund|maintenance|flagged|leave|expired|dirty/i.test(status) ? "rose" : "gray";
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
