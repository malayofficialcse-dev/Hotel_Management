"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type AdminBooking, type AdminDepartment, type AdminEmployee, type AdminHotel, type AdminOffer, type AdminPayment, type AdminReview, type AdminRoom, type HousekeepingTask } from "@/lib/api-client";
import { PaymentsWorkspace } from "./payments-workspace";
import { ReservationsWorkspace } from "./reservations-workspace";
import {
  sectionTabs,
  sectionTitles,
  type AdminRecord,
  type AdminSection,
} from "./admin-data";

const formatNumber = (value: number) => value.toLocaleString("en-IN");

async function loadLiveRecords(section: AdminSection): Promise<AdminRecord[] | null> {
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (section === "reservations") {
    const result = await api.getAdminReservations();
    return result.bookings.map((booking: AdminBooking) => ({
      id: booking.booking_code,
      name: `${booking.guest_first_name} ${booking.guest_last_name}`.trim(),
      detail: `${booking.hotel_name} · ${booking.room_type_name}`,
      status: booking.status.replaceAll("_", " "),
      value: `₹${booking.total_price.toLocaleString("en-IN")}`,
      date: new Date(booking.created_at || booking.check_in_date).toLocaleDateString("en-IN"),
    }));
  }
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
  if (section === "offers") {
    const rows = await api.getAdminOffers();
    return rows.map((offer: AdminOffer) => ({
      id: offer._id,
      name: offer.name,
      detail: `${offer.code} · ${offer.discountValue}${offer.discountType === "PERCENTAGE" ? "%" : " off"}`,
      status: offer.isActive ? "Active" : "Inactive",
      value: offer.discountType === "PERCENTAGE" ? `${offer.discountValue}%` : `₹${offer.discountValue.toLocaleString("en-IN")}`,
      date: offer.startsAt ? new Date(offer.startsAt).toLocaleDateString("en-IN") : "—",
    }));
  }
  if (section === "customers") {
    const { bookings } = await api.getAdminReservations();
    const customers = new Map<string, AdminBooking>();
    for (const booking of bookings) if (!customers.has(booking.guest_email.toLowerCase())) customers.set(booking.guest_email.toLowerCase(), booking);
    return [...customers.values()].map((booking) => ({ id: booking.guest_email, name: `${booking.guest_first_name} ${booking.guest_last_name}`.trim(), detail: booking.guest_email, status: "Guest", value: `${bookings.filter((item) => item.guest_email.toLowerCase() === booking.guest_email.toLowerCase()).length} reservations`, date: new Date(booking.created_at || booking.check_in_date).toLocaleDateString("en-IN") }));
  }
  if (section === "payments") {
    return (await api.getAdminPayments()).map((payment: AdminPayment) => {
      const billNo = payment.metadata?.billNumber || payment.metadata?.invoiceNumber;
      return {
        id: payment.id,
        name: payment.bookingCode,
        detail: `${billNo ? `Bill #${billNo} · ` : ""}${payment.paymentMethod || payment.provider}`,
        status: payment.status,
        value: `${payment.currency} ${payment.amount.toLocaleString("en-IN")}`,
        date: new Date(payment.createdAt).toLocaleDateString("en-IN"),
      };
    });
  }
  if (section === "reviews") return (await api.getAdminReviews()).map((review: AdminReview) => ({ id: review._id, name: review.userName, detail: `${review.hotelId} · ${review.title || review.comment}`, status: review.isHidden ? "Hidden" : review.isApproved ? "Published" : "Pending", value: `${review.rating} / 5`, date: new Date(review.createdAt).toLocaleDateString("en-IN") }));
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
    { name: "price", label: "Price per night", type: "number", required: true, min: 0, step: 0.01 },
    { name: "capacity", label: "Guest capacity", type: "number", required: true, min: 1, step: 1 },
    { name: "totalInventory", label: "Room inventory", type: "number", required: true, min: 0, step: 1 },
  ],
  reservations: [
    { name: "hotelId", label: "Hotel", required: true },
    { name: "roomTypeId", label: "Room type", required: true },
    { name: "checkInDate", label: "Check-in date", type: "date", required: true },
    { name: "checkOutDate", label: "Check-out date", type: "date", required: true },
    { name: "guestsCount", label: "Guests", type: "number", required: true },
    { name: "roomCount", label: "Rooms", type: "number", required: true },
    { name: "guestFirstName", label: "Guest first name", required: true },
    { name: "guestLastName", label: "Guest last name", required: true },
    { name: "guestEmail", label: "Guest email", type: "email", required: true },
    { name: "guestPhone", label: "Guest phone", type: "tel", required: true },
    { name: "specialRequests", label: "Special requests" },
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
  offers: [
    { name: "code", label: "Offer code", required: true },
    { name: "name", label: "Offer name", required: true },
    { name: "description", label: "Description" },
    { name: "discountType", label: "Discount type", required: true, options: [{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED", label: "Fixed amount" }] },
    { name: "discountValue", label: "Discount value", type: "number", required: true },
    { name: "startsAt", label: "Starts at", type: "date" },
    { name: "endsAt", label: "Ends at", type: "date" },
  ],
};

export function AdminWorkspace({ section }: { section: AdminSection }) {
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(sectionTabs[section]?.[0] ?? "Overview");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const content = sectionTitles[section];
  const live = ["hotels", "rooms", "reservations", "customers", "departments", "employees", "housekeeping", "offers", "payments", "reviews"].includes(section);

  useEffect(() => {
    let active = true;
    setRecords([]);
    setNotice("");
    setLoadFailed(false);
    if (!live) return () => { active = false; };
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
    } else if (section === "reviews") {
      setTab("Needs reply");
    } else {
      setNotice(`${content.title} is not connected to a create API. No record was saved.`);
    }
  }

  async function submitCreate(data: Record<string, unknown>) {
    let createdRecord: AdminRecord | undefined;
    try {
      if (section === "hotels") await api.createHotel(data);
      else if (section === "rooms") await api.createRoom(data);
      else if (section === "reservations") {
        const [hotels, rooms] = await Promise.all([api.getAdminHotels(), api.getAdminRooms()]);
        const hotel = hotels.find((item) => item.slug === data.hotelId || item._id === data.hotelId);
        const room = rooms.find((item) => item._id === data.roomTypeId);
        if (!hotel || !room) throw new Error("Select an existing hotel and room type.");
        if (room.hotelId !== hotel.slug && room.hotelId !== hotel._id) throw new Error("The selected room does not belong to the selected hotel.");
        const result = await api.holdRoom({
          hotelId: hotel.slug || hotel._id,
          hotelName: hotel.name,
          roomTypeId: room._id,
          roomTypeName: room.name,
          checkInDate: String(data.checkInDate),
          checkOutDate: String(data.checkOutDate),
          guestsCount: Number(data.guestsCount),
          roomCount: Number(data.roomCount),
          guestFirstName: String(data.guestFirstName),
          guestLastName: String(data.guestLastName),
          guestEmail: String(data.guestEmail),
          guestPhone: String(data.guestPhone),
          specialRequests: typeof data.specialRequests === "string" ? data.specialRequests : undefined,
        });
        if (!result.success) throw new Error(result.message);
        createdRecord = {
          id: result.data.bookingCode,
          name: `${data.guestFirstName} ${data.guestLastName}`,
          detail: `${hotel.name} · ${room.name}`,
          status: "PENDING PAYMENT",
          value: `₹${result.data.totalPrice.toLocaleString("en-IN")}`,
          date: new Date().toLocaleDateString("en-IN"),
        };
      }
      else if (section === "departments") await api.createDepartment(data);
      else if (section === "employees") await api.createEmployee(data);
      else if (section === "housekeeping") await api.createHousekeepingTask(data);
      else if (section === "offers") await api.createOffer(data);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not create record: ${error.message}` : "Could not create record.");
      return;
    }

    setCreateOpen(false);
    if (createdRecord) setRecords((rows) => [createdRecord as AdminRecord, ...rows]);
    setNotice("Record saved to the service database.");
    setLoading(true);
    try {
      const rows = await loadLiveRecords(section);
      if (rows) setRecords(rows);
    } catch (error) {
      setLoadFailed(true);
      setNotice(error instanceof Error ? `Record saved, but the list could not be refreshed: ${error.message}` : "Record saved, but the list could not be refreshed.");
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
        else if (section === "offers") await api.deleteOffer(row.id);
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
    return <Dashboard />;
  }

  if (section === "reports") return <Reports />;

  if (section === "payments") return <PaymentsWorkspace />;

  if (section === "reservations") return <ReservationsWorkspace />;

  if (section === "settings") {
    return (
      <>
        <PageHeader section={section} notice={notice} onAction={onAction} actionAvailable={false} />
        <section className="admin-panel admin-table-panel">
          <div className="admin-empty">Workspace settings are not connected to persistent storage. No sample settings are shown or saved.</div>
        </section>
      </>
    );
  }

  const actionAvailable = Boolean(createFields[section]);
  const unsupportedMessage: Partial<Record<AdminSection, string>> = {
    customers: "Guest records are derived from persisted reservations.",
    roles: "Custom role and permission records are not implemented in the auth database yet.",
    notifications: "Notification history is currently held in service memory and is not persisted. No sample history is shown.",
    audit: "No persistent audit-log API is connected here.",
  };

  return (
    <>
      <PageHeader section={section} notice={notice} onAction={onAction} actionAvailable={actionAvailable} />
      {live && <Stats section={section} records={records} unavailable={loadFailed} />}
      {unsupportedMessage[section] && <div className="admin-inline-notice" role="status">{unsupportedMessage[section]}</div>}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div><h2>{`All ${content.title.toLowerCase()}`}</h2><p>{formatNumber(filtered.length)} database record{filtered.length === 1 ? "" : "s"}</p></div>
        </div>
        {sectionTabs[section] && (
          <div className="admin-tabs" role="tablist" aria-label={`${content.title} views`}>
            {sectionTabs[section]?.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "is-selected" : ""} onClick={() => setTab(item)}>{item}</button>)}
          </div>
        )}
        <div className="admin-table-tools">
          <label className="admin-table-search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${content.title.toLowerCase()}...`} /></label>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th><input type="checkbox" aria-label="Select all rows" /></th><th>ID</th><th>{section === "customers" || section === "employees" ? "GUEST / TEAM MEMBER" : "NAME"}</th><th>DETAILS</th><th>STATUS</th><th>{section === "hotels" ? "RATING" : "VALUE"}</th><th>UPDATED</th><th><span className="sr-only">Actions</span></th></tr></thead>
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
                <td>
                  {section === "housekeeping" || ["hotels", "rooms", "departments", "employees", "offers"].includes(section) ? (
                    <button className="admin-row-menu" type="button" aria-label={`Actions for ${row.name}`} onClick={() => void onRecordAction(row)}>
                      {section === "housekeeping" ? "Update" : "Remove"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}</tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="admin-empty">
              {loadFailed ? (
                <div>
                  <p>Could not load {content.title.toLowerCase()}. {notice || "Check the service connection."}</p>
                  <p style={{ marginTop: "12px" }}>
                    <Link
                      href="/admin/login?relogin=1"
                      className="admin-primary-button"
                      style={{ fontSize: "12px", padding: "6px 14px", textDecoration: "none", display: "inline-block" }}
                    >
                      Sign In Again as Admin
                    </Link>
                  </p>
                </div>
              ) : query ? (
                `No database records match “${query}”.`
              ) : live ? (
                `No ${content.title.toLowerCase()} have been saved yet. Use “${content.action}” to add the first record.`
              ) : (
                unsupportedMessage[section] || `No ${content.title.toLowerCase()} are stored.`
              )}
            </div>
          )}
        </div>
        <div className="admin-table-foot"><span>{formatNumber(filtered.length)} records shown</span><div><span>Page 1 of 1</span><button type="button" aria-label="Previous page" disabled>‹</button><button type="button" aria-label="Next page" disabled>›</button></div></div>
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

function PageHeader({ section, notice, onAction, actionAvailable = true }: { section: AdminSection; notice: string; onAction: () => void; actionAvailable?: boolean }) {
  const content = sectionTitles[section];
  return (
    <div className="admin-page-heading">
      <div><div className="admin-eyebrow">WORKSPACE&nbsp; / &nbsp;{content.title.toUpperCase()}</div><h1>{content.title}</h1><p>{content.subtitle}</p></div>
      <div className="admin-heading-actions">
        <button type="button" className="admin-secondary-button" onClick={() => window.print()}>↓ <span>Export</span></button>
        <button type="button" className="admin-primary-button" onClick={onAction} disabled={!actionAvailable} title={actionAvailable ? undefined : "This section is not connected to a persistent API"}>＋ {content.action}</button>
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
  let cards = suppliedCards;
  if (!cards && records && ["hotels", "rooms", "reservations", "departments", "employees", "housekeeping", "offers"].includes(section)) {
    const inactiveStatuses = ["INACTIVE", "CANCELLED", "EXPIRED", "CHECKED OUT"];
    const active = records.filter((row) => !inactiveStatuses.includes(row.status.toUpperCase())).length;
    cards = unavailable
      ? [
        { label: "Total records", value: "Unavailable", note: "Service connection failed" },
        { label: "Active", value: "Unavailable", note: "Service connection failed" },
        { label: "Inactive", value: "Unavailable", note: "Service connection failed" },
        { label: "Latest record", value: "Unavailable", note: "Service connection failed" },
      ]
      : [
        { label: "Total records", value: formatNumber(records.length), note: "Stored in service database" },
        { label: "Active", value: formatNumber(active), note: "From returned records" },
        { label: "Inactive", value: formatNumber(records.length - active), note: "From returned records" },
        { label: "Latest record", value: records[0]?.date || "—", note: records.length ? "Created date" : "No records yet" },
      ];
  }
  if (!cards) return null;
  return <div className="admin-stats-grid">{cards.map((stat, index) => <div key={stat.label} className="admin-stat-card"><div className="admin-stat-top"><span>{stat.label}</span><span className={`admin-stat-icon tone-${index % 4}`}>{["↗", "⌂", "▤", "◷"][index % 4]}</span></div><strong>{stat.value}</strong><small>{stat.note}</small></div>)}</div>;
}

type CreateField = {
  name: string;
  label: string;
  type?: string;
  min?: number;
  step?: number;
  options?: { value: string; label: string }[];
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
  const [reservationHotels, setReservationHotels] = useState<AdminHotel[]>([]);
  const [reservationRooms, setReservationRooms] = useState<AdminRoom[]>([]);

  useEffect(() => {
    let active = true;
    const lookups: [string, string, Promise<{ value: string; label: string }[]>][] = [];
    if (["rooms", "departments", "housekeeping"].includes(section)) {
      lookups.push(["hotelId", "hotels", api.getAdminHotels().then((rows) =>
        rows.filter((hotel) => section !== "rooms" || hotel.isActive).map((hotel) => ({ value: hotel.slug || hotel._id, label: `${hotel.name} · ${hotel.city}` })),
      )]);
    }
    if (section === "reservations") {
      lookups.push(["hotelId", "hotels", api.getAdminHotels().then((rows) => {
        if (active) setReservationHotels(rows);
        return rows.map((hotel) => ({ value: hotel.slug || hotel._id, label: `${hotel.name} · ${hotel.city}` }));
      })]);
      lookups.push(["roomTypeId", "room types", api.getAdminRooms().then((rows) => {
        if (active) setReservationRooms(rows);
        return rows.map((room) => ({ value: room._id, label: `${room.name} · ${room.hotelId}` }));
      })]);
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

  const reservationRoomOptions = useMemo(() => {
    if (section !== "reservations") return [];
    const selectedHotelId = values.hotelId;
    if (!selectedHotelId) return [];
    const selectedHotel = reservationHotels.find(
      (h) => (h.slug || h._id) === selectedHotelId || h._id === selectedHotelId || h.slug === selectedHotelId,
    );
    return reservationRooms
      .filter((room) => {
        if (selectedHotel) {
          return room.hotelId === selectedHotel.slug || room.hotelId === selectedHotel._id || room.hotelId === selectedHotelId;
        }
        return room.hotelId === selectedHotelId;
      })
      .map((room) => ({
        value: room._id,
        label: `${room.name} · ₹${room.price.toLocaleString("en-IN")}/night (${room.capacity} guests)`,
      }));
  }, [section, values.hotelId, reservationHotels, reservationRooms]);

  const requiredLookupsReady = fields
    .filter((field) => field.required && ["hotelId", "departmentId", "roomTypeId"].includes(field.name))
    .every((field) => {
      if (field.name === "roomTypeId" && section === "reservations") {
        return Boolean(values.hotelId && reservationRoomOptions.length > 0);
      }
      return Boolean(lookupOptions[field.name]?.length);
    });
  const hasRequiredLookups = fields.some((field) => field.required && ["hotelId", "departmentId", "roomTypeId"].includes(field.name));
  const missingRequiredOptions = fields.some((field) => {
    if (field.name === "roomTypeId" && section === "reservations") {
      return Boolean(values.hotelId && reservationRoomOptions.length === 0);
    }
    return field.required && ["hotelId", "departmentId"].includes(field.name) && !lookupOptions[field.name]?.length;
  });

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-dialog" onSubmit={(event) => {
        event.preventDefault();
        const data: Record<string, unknown> = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
        for (const field of ["basePrice", "price", "capacity", "totalInventory", "salary", "guestsCount", "roomCount", "discountValue"]) {
          if (data[field] !== undefined) data[field] = Number(data[field]);
        }
        onSubmit(data);
      }}>
        <div className="admin-dialog-heading"><div><span className="admin-eyebrow">NEW RECORD</span><h2>{sectionTitles[section].action}</h2></div><button type="button" className="admin-row-menu" aria-label="Close dialog" onClick={onClose}>×</button></div>
        <div className="admin-dialog-fields">
          {fields.map((field) => {
            const isReservationRoom = field.name === "roomTypeId" && section === "reservations";
            const options = isReservationRoom ? reservationRoomOptions : lookupOptions[field.name];
            return (
              <label key={field.name}>{field.label}
                {options ? (
                  <select
                    required={field.required}
                    value={values[field.name] || ""}
                    disabled={isReservationRoom && !values.hotelId}
                    onChange={(event) => {
                      const val = event.target.value;
                      setValues((current) => ({
                        ...current,
                        [field.name]: val,
                        ...(field.name === "hotelId" && section === "reservations" ? { roomTypeId: "" } : {}),
                      }));
                    }}
                  >
                    <option value="">
                      {loadingLookups
                        ? "Loading choices…"
                        : isReservationRoom && !values.hotelId
                          ? "Select a hotel first"
                          : isReservationRoom && options.length === 0
                            ? "No rooms available for this hotel"
                            : "Select an option"}
                    </option>
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : field.options ? (
                  <select
                    required={field.required}
                    value={values[field.name] || ""}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  >
                    <option value="">Select an option</option>
                    {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input
                    autoComplete="off"
                    required={field.required}
                    type={field.type || "text"}
                    min={field.min}
                    step={field.step}
                    placeholder={field.placeholder}
                    pattern={field.pattern}
                    title={field.title}
                    value={values[field.name] || ""}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  />
                )}
              </label>
            );
          })}
        </div>
        {lookupErrors.length > 0 && <p className="admin-dialog-error" role="alert">Could not load record choices: {lookupErrors.join("; ")}. Start the related services and retry.</p>}
        {!loadingLookups && lookupErrors.length === 0 && hasRequiredLookups && missingRequiredOptions &&
          <p className="admin-dialog-error" role="alert">
            {section === "reservations" && values.hotelId && reservationRoomOptions.length === 0
              ? "No rooms exist for the selected hotel yet. Create rooms for this hotel first under the Rooms tab."
              : "No matching records exist yet. Create the required hotel or department first."}
          </p>}
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

function Dashboard() {
  const [notice, setNotice] = useState("");
  const [overview, setOverview] = useState<{
    hotels: AdminHotel[] | null;
    rooms: AdminRoom[] | null;
    employees: AdminEmployee[] | null;
    tasks: HousekeepingTask[] | null;
    reservations: AdminBooking[] | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.getAdminHotels(),
      api.getAdminRooms(),
      api.getAdminEmployees(),
      api.getAdminHousekeepingTasks(),
      api.getAdminReservations(),
    ]).then(([hotelResult, roomResult, employeeResult, taskResult, reservationResult]) => {
      if (!active) return;
      const failures = [hotelResult, roomResult, employeeResult, taskResult, reservationResult].filter((result) => result.status === "rejected");
      setOverview({
        hotels: hotelResult.status === "fulfilled" ? hotelResult.value : null,
        rooms: roomResult.status === "fulfilled" ? roomResult.value : null,
        employees: employeeResult.status === "fulfilled" ? employeeResult.value : null,
        tasks: taskResult.status === "fulfilled" ? taskResult.value : null,
        reservations: reservationResult.status === "fulfilled" ? reservationResult.value.bookings : null,
      });
      if (failures.length) setNotice(`${failures.length} dashboard service${failures.length === 1 ? "" : "s"} could not be reached.`);
    });
    return () => { active = false; };
  }, []);

  const dashboardCards = [
    { label: "Properties", value: overview?.hotels ? formatNumber(overview.hotels.length) : overview ? "Unavailable" : "Loading…", note: "Hotel database" },
    { label: "Room inventory", value: overview?.rooms ? formatNumber(overview.rooms.reduce((sum, room) => sum + room.totalInventory, 0)) : overview ? "Unavailable" : "Loading…", note: "Room database" },
    { label: "Reservations", value: overview?.reservations ? formatNumber(overview.reservations.length) : overview ? "Unavailable" : "Loading…", note: "Booking database" },
    { label: "Team members", value: overview?.employees ? formatNumber(overview.employees.length) : overview ? "Unavailable" : "Loading…", note: "Employee database" },
    { label: "Open housekeeping", value: overview?.tasks ? formatNumber(overview.tasks.filter((task) => task.status !== "INSPECTED").length) : overview ? "Unavailable" : "Loading…", note: "Housekeeping database" },
    { label: "Guest rating", value: overview?.hotels ? (overview.hotels.length ? `${(overview.hotels.reduce((sum, hotel) => sum + hotel.rating, 0) / overview.hotels.length).toFixed(1)} / 5` : "—") : overview ? "Unavailable" : "Loading…", note: "Average from stored properties" },
  ];
  const roomInventory = new Map<string, { types: number; rooms: number }>();
  for (const room of overview?.rooms || []) {
    const current = roomInventory.get(room.hotelId) || { types: 0, rooms: 0 };
    current.types += 1;
    current.rooms += room.totalInventory;
    roomInventory.set(room.hotelId, current);
  }
  const upcoming = overview?.reservations?.slice(0, 4) || [];
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <>
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow">{today}&nbsp; · &nbsp;DATABASE OVERVIEW</div><h1>Workspace overview</h1><p>Counts below come from connected service databases.</p></div>
        <div className="admin-heading-actions"><button type="button" className="admin-secondary-button" onClick={() => window.print()}>Print</button></div>
      </div>
      {notice && <div className="admin-inline-notice" role="status">{notice}</div>}
      <Stats section="dashboard" cards={dashboardCards} />
      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-heading"><div><h2>Revenue overview</h2><p>Calculated from persisted payments.</p></div></div>
          <div className="admin-empty">No live revenue report is connected yet. No sample totals are displayed.</div>
        </section>
        <section className="admin-panel admin-occupancy-panel">
          <div className="admin-panel-heading"><div><h2>Room inventory by property</h2><p>Counts from the room database</p></div></div>
          {overview?.rooms && overview.hotels ? Array.from(roomInventory, ([hotelId, inventory]) => {
            const hotel = overview.hotels?.find((item) => item.slug === hotelId || item._id === hotelId);
            return <div className="admin-occupancy-row" key={hotelId}><span>{hotel?.name || hotelId}</span><strong>{formatNumber(inventory.rooms)} rooms · {inventory.types} types</strong></div>;
          }) : <div className="admin-empty">{overview ? "Room inventory is unavailable." : "Loading room inventory…"}</div>}
        </section>
        <section className="admin-panel admin-dashboard-table">
          <div className="admin-panel-heading"><div><h2>Recent reservations</h2><p>Latest records from the booking database</p></div><Link href="/admin/reservations" className="admin-mini-link">View all →</Link></div>
          <div className="admin-compact-rows">{upcoming.map((booking) => <div className="admin-compact-row" key={booking.id}><span className="admin-row-avatar">{booking.guest_first_name.slice(0, 1)}{booking.guest_last_name.slice(0, 1)}</span><span className="admin-compact-person"><strong>{booking.guest_first_name} {booking.guest_last_name}</strong><small>{booking.hotel_name} · {booking.room_type_name}</small></span><StatusBadge status={booking.status.replaceAll("_", " ")} /><strong className="admin-compact-price">₹{booking.total_price.toLocaleString("en-IN")}</strong></div>)}
            {overview?.reservations?.length === 0 && <div className="admin-empty">No reservations are stored.</div>}
            {!overview?.reservations && <div className="admin-empty">{overview ? "Reservation data is unavailable." : "Loading reservations…"}</div>}
          </div>
        </section>
        <section className="admin-panel admin-activity-panel">
          <div className="admin-panel-heading"><div><h2>Recent activity</h2><p>Service event history</p></div><Link href="/admin/audit" className="admin-mini-link">Audit log →</Link></div>
          <div className="admin-empty">No audit-event feed is connected. No sample activity is displayed.</div>
        </section>
      </div>
      <div className="admin-dashboard-note"><span>ⓘ</span><span>Dashboard metrics are read from service databases. Failed services are marked unavailable rather than replaced with sample values.</span><Link href="/admin/reports">Reports →</Link></div>
    </>
  );
}

function Reports() {
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getAdminReservations(), api.getAdminPayments()]).then(([bookingResult, paymentResult]) => {
      if (!active) return;
      if (bookingResult.status === "fulfilled") setBookings(bookingResult.value.bookings);
      if (paymentResult.status === "fulfilled") setPayments(paymentResult.value);
      const failures = [bookingResult, paymentResult].filter((result) => result.status === "rejected").length;
      if (failures) setError(`${failures} data source${failures === 1 ? "" : "s"} could not be reached.`);
    });
    return () => { active = false; };
  }, []);
  const revenue = payments?.filter((payment) => ["SUCCESS", "REFUNDED"].includes(payment.status)).reduce((sum, payment) => sum + payment.amount - (payment.refunds || []).filter((refund) => refund.status === "SUCCESS").reduce((refundTotal, refund) => refundTotal + refund.amount, 0), 0);
  return <>
    <PageHeader section="reports" notice={error} onAction={() => window.print()} actionAvailable={false} />
    <section className="admin-panel admin-table-panel">
      <div className="admin-panel-heading"><div><h2>Reservation and payment summary</h2><p>Calculated from current service database records.</p></div></div>
      {!bookings || !payments ? <div className="admin-empty">{error || "Loading report data…"}</div> : <div className="admin-dashboard-grid">
        <div className="admin-stat-card"><span>Reservations</span><strong>{formatNumber(bookings.length)}</strong></div>
        <div className="admin-stat-card"><span>Net collected revenue</span><strong>{revenue === undefined ? "Unavailable" : `₹${revenue.toLocaleString("en-IN")}`}</strong></div>
        <div className="admin-stat-card"><span>Payment records</span><strong>{formatNumber(payments.length)}</strong></div>
        <div className="admin-stat-card"><span>Average booking value</span><strong>{bookings.length ? `₹${Math.round(bookings.reduce((sum, booking) => sum + booking.total_price, 0) / bookings.length).toLocaleString("en-IN")}` : "—"}</strong></div>
      </div>}
    </section>
  </>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = /active|confirmed|paid|available|published|completed|checked in|clean|inspected/i.test(status) ? "green" : /pending|scheduled|reply|occupied|unread|in progress/i.test(status) ? "amber" : /cancel|refund|maintenance|flagged|leave|expired|dirty/i.test(status) ? "rose" : "gray";
  return <span className={`admin-status status-${tone}`}><i />{status}</span>;
}

function ToggleRow(_props: { title: string; detail: string }) {
  return null;
}

