"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type AdminBooking, type AdminDepartment, type AdminEmployee, type AdminHotel, type AdminOffer, type AdminPayment, type AdminReview, type AdminRoom, type HousekeepingTask } from "@/lib/api-client";
import { exportToExcel } from "@/lib/export-excel";
import { DownloadIcon } from "@/components/icons";
import { AdminPagination } from "./admin-pagination";
import { PaymentsWorkspace } from "./payments-workspace";
import { ReservationsWorkspace } from "./reservations-workspace";
import { HousekeepingWorkspace } from "./housekeeping-workspace";
import { EmployeesWorkspace } from "./employees-workspace";
import { ProfileWorkspace } from "./profile-workspace";
import { RolesWorkspace } from "./roles-workspace";
import { GuestRequestsWorkspace } from "./guest-requests-workspace";
import { ADMIN_MODULES, canPerform, getEffectivePermissions, type AdminModule } from "@/lib/rbac";
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
      image: hotel.mainImage || hotel.galleryImages?.[0],
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
      image: room.image,
      room,
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
      id: employee.employeeCode || employee.id,
      name: employee.name,
      detail: `${employee.department?.name || employee.departmentId} · ${employee.email}`,
      status: employee.isActive ? "Active" : "Inactive",
      value: employee.position,
      date: employee.joiningDate
        ? new Date(employee.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : date,
    }));
  }
  if (section === "housekeeping") {
    const rows = await api.getAdminHousekeepingTasks();
    return rows.map((task: HousekeepingTask) => {
      const guestText = task.guestName && task.guestName !== "Vacant"
        ? ` · Guest: ${task.guestName}${task.bookingReference ? ` (${task.bookingReference})` : ""}`
        : task.guestName === "Vacant"
          ? " · Vacant"
          : "";
      const taskDateText = task.taskDate ? ` · Scheduled: ${task.taskDate}` : "";
      return {
        id: task._id,
        name: `Room ${task.roomNumber}`,
        detail: `${task.hotelId} · ${task.taskType || "STANDARD"}${taskDateText}${guestText}`,
        status: task.status.replaceAll("_", " "),
        value: task.assignedTo || "Unassigned",
        date: task.taskDate || (task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("en-IN") : date),
      };
    });
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
    { name: "slug", label: "URL slug", placeholder: "Leave blank to generate from hotel name" },
    { name: "city", label: "City", required: true },
    { name: "location", label: "Location", required: true },
    { name: "latitude", label: "Latitude", type: "number" },
    { name: "longitude", label: "Longitude", type: "number" },
    { name: "category", label: "Category", required: true },
    { name: "basePrice", label: "Base price per night", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "tag", label: "Tag", placeholder: "e.g. Beachfront" },
    { name: "offer", label: "Offer", placeholder: "e.g. 20% off" },
    { name: "rating", label: "Rating (0-5)", type: "number", min: 0, max: 5, step: 0.1 },
    { name: "reviewsCount", label: "Review count", type: "number", min: 0, step: 1 },
    { name: "amenities", label: "Amenities (comma-separated)", type: "list", placeholder: "Free Wi-Fi, Pool, Spa" },
    { name: "isActive", label: "Status", options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] },
    { name: "mainImageFile", label: "Cover image", type: "file" },
    { name: "galleryImagesFiles", label: "Gallery images", type: "file", multiple: true },
  ],
  rooms: [
    { name: "hotelId", label: "Hotel slug / ID", required: true },
    { name: "name", label: "Room name", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "price", label: "Price per night", type: "number", required: true, min: 0, step: 0.01 },
    { name: "capacity", label: "Guest capacity", type: "number", required: true, min: 1, step: 1 },
    { name: "totalInventory", label: "Room inventory", type: "number", required: true, min: 0, step: 1 },
    { name: "bedType", label: "Bed type", placeholder: "e.g. King" },
    { name: "roomSize", label: "Room size", placeholder: "e.g. 42 m²" },
    { name: "amenities", label: "Amenities (comma-separated)", type: "list", placeholder: "Balcony, Free Wi-Fi, Mini bar" },
    { name: "isActive", label: "Status", options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] },
    { name: "imageFile", label: "Room image", type: "file" },
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
    { name: "hotelId", label: "Hotel", required: true },
    { name: "departmentId", label: "Department", required: true },
    { name: "name", label: "Full name", required: true, placeholder: "e.g. Rahul Sharma" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "e.g. rahul@stayease.com" },
    { name: "phone", label: "Phone number", placeholder: "e.g. 9876543210" },
    { name: "position", label: "Position / Role", required: true, placeholder: "e.g. Front Desk Officer" },
    { name: "joiningDate", label: "Joining date", type: "date", required: true },
    { name: "salary", label: "Salary", type: "number", placeholder: "e.g. 35000" },
  ],
  housekeeping: [
    { name: "hotelId", label: "Hotel", required: true },
    { name: "roomNumber", label: "Room", required: true },
    { name: "taskDate", label: "Task date", type: "date", required: true },
    {
      name: "taskType",
      label: "Task type",
      options: [
        { value: "CLEAN", label: "Daily Clean" },
        { value: "CHECKOUT CLEAN", label: "Checkout Clean" },
        { value: "DEEP CLEAN", label: "Deep Clean" },
        { value: "INSPECTION", label: "Room Inspection" },
        { value: "REPAIR", label: "Maintenance / Repair" },
        { value: "TURNDOWN", label: "Evening Turndown" },
      ],
    },
    { name: "assignedTo", label: "Assigned employee" },
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
  const [editingRoom, setEditingRoom] = useState<AdminRoom | null>(null);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [section, query, tab]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  function onAction() {
    if (!canPerform(api.getUser(), section as AdminModule, "create")) {
      setNotice("You do not have permission to create records in this module.");
      return;
    }
    if (live) {
      setCreateOpen(true);
      setNotice("");
    } else if (section === "reviews") {
      setTab("Needs reply");
    } else {
      setNotice(`${content.title} is not connected to a create API. No record was saved.`);
    }
  }

  async function submitCreate(data: Record<string, unknown>, files: Record<string, File[]> = {}) {
    if (!canPerform(api.getUser(), section as AdminModule, "create")) {
      setNotice("You do not have permission to create records in this module.");
      return;
    }
    let createdRecord: AdminRecord | undefined;
    try {
      if (section === "hotels") {
        const payload = { ...data };
        const cover = files.mainImageFile?.[0];
        if (cover) payload.mainImage = (await api.uploadHotelImage(cover)).url;
        const galleryFiles = files.galleryImagesFiles || [];
        if (galleryFiles.length) {
          payload.galleryImages = await Promise.all(galleryFiles.map(async (file) => (await api.uploadHotelImage(file)).url));
        }
        await api.createHotel(payload);
      } else if (section === "rooms") {
        const payload = { ...data };
        const image = files.imageFile?.[0];
        if (image) payload.image = (await api.uploadRoomImage(image)).url;
        await api.createRoom(payload);
      }
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
      else if (section === "employees") {
        const hotels = await api.getAdminHotels();
        const hotel = hotels.find((h) => (h.slug || h._id) === data.hotelId || h._id === data.hotelId || h.slug === data.hotelId);
        const created = await api.createEmployee({
          ...data,
          hotelName: hotel ? hotel.name : undefined,
        });
        createdRecord = {
          id: created.employeeCode || created.id,
          name: created.name,
          detail: `${created.department?.name || created.departmentId} · ${created.email}`,
          status: created.isActive ? "Active" : "Inactive",
          value: created.position,
          date: new Date().toLocaleDateString("en-IN"),
        };
      }
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

  async function submitRoomEdit(data: Record<string, unknown>, files: Record<string, File[]>) {
    if (!canPerform(api.getUser(), "rooms", "edit")) {
      setNotice("You do not have permission to edit room records.");
      return;
    }
    try {
      if (!editingRoom) throw new Error("The room being edited is no longer available.");
      const payload = { ...data };
      const image = files.imageFile?.[0];
      if (image) payload.image = (await api.uploadRoomImage(image)).url;
      await api.updateRoom(editingRoom._id, payload);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not update room: ${error.message}` : "Could not update room.");
      return;
    }

    const updatedName = editingRoom?.name || "Room";
    setEditingRoom(null);
    setNotice(`${updatedName} updated.`);
    setLoading(true);
    try {
      setRecords((await loadLiveRecords("rooms")) || []);
    } catch (error) {
      setNotice(error instanceof Error
        ? `Room updated, but the list could not be refreshed: ${error.message}`
        : "Room updated, but the list could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }

  async function onRecordAction(row: AdminRecord) {
    const action = section === "housekeeping" ? "edit" : "delete";
    if (!canPerform(api.getUser(), section as AdminModule, action)) {
      setNotice(`You do not have permission to ${action} records in this module.`);
      return;
    }
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

  const user = api.getUser();
  const effectiveMatrix = getEffectivePermissions(user);
  const isSuperAdmin = user?.role === "ADMIN" || user?.email?.toLowerCase() === "mala@gmail.com";
  const modPerm = effectiveMatrix[(section === "guest-requests" ? "housekeeping" : section) as AdminModule] || {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  // Profile is universally accessible to any authenticated staff/admin
  if (section === "profile") {
    return <ProfileWorkspace />;
  }

  // Check section view access
  const hasViewAccess = isSuperAdmin || (
    section === "settings" ? isSuperAdmin :
      section === "audit" ? isSuperAdmin || Boolean(effectiveMatrix.reports?.view) :
        section === "notifications" ? Object.values(effectiveMatrix).some((p) => p && p.view) :
          Boolean(modPerm.view)
  );

  if (!hasViewAccess) {
    const firstAllowed = ADMIN_MODULES.find((m) => effectiveMatrix[m.id]?.view);
    return (
      <div
        className="admin-panel"
        style={{
          padding: "48px 24px",
          textAlign: "center",
          maxWidth: "600px",
          margin: "40px auto",
          borderRadius: "8px",
          border: "1px solid #E5EBE7",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: "#FEE2E2",
            color: "#991B1B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          ✕
        </div>
        <h2 style={{ fontSize: "18px", color: "#111827", marginBottom: "8px", fontWeight: 700 }}>Access Restricted</h2>
        <p style={{ color: "#617169", fontSize: "13px", lineHeight: 1.5, marginBottom: "20px" }}>
          Your account does not have permission to view the <strong style={{ color: "#111827" }}>{content.title}</strong> module.
          You only have access to your assigned modules.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {firstAllowed && (
            <Link
              href={firstAllowed.id === "dashboard" ? "/admin" : `/admin/${firstAllowed.id}`}
              className="admin-primary-button"
              style={{ textDecoration: "none" }}
            >
              Go to {firstAllowed.label} →
            </Link>
          )}
          <Link href="/admin/profile" className="admin-secondary-button" style={{ textDecoration: "none" }}>
            My Profile
          </Link>
        </div>
      </div>
    );
  }

  if (section === "guest-requests") return <GuestRequestsWorkspace />;

  if (section === "dashboard") {
    return <Dashboard />;
  }

  if (section === "reports") return <Reports />;

  if (section === "payments") return <PaymentsWorkspace />;

  if (section === "reservations") return <ReservationsWorkspace />;

  if (section === "housekeeping") return <HousekeepingWorkspace />;

  if (section === "employees") return <EmployeesWorkspace />;

  if (section === "roles") return <RolesWorkspace />;

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

  const actionAvailable = Boolean(createFields[section]) && (isSuperAdmin || modPerm.create);
  const unsupportedMessage: Partial<Record<AdminSection, string>> = {
    customers: "Guest records are derived from persisted reservations.",
    roles: "Custom role and permission records are not implemented in the auth database yet.",
    notifications: "Notification history is currently held in service memory and is not persisted. No sample history is shown.",
    audit: "No persistent audit-log API is connected here.",
  };

  const handleExportExcel = () => {
    if (!filtered || filtered.length === 0) {
      setNotice(`No ${content.title.toLowerCase()} records to export.`);
      return;
    }
    const headers = [
      "ID",
      section === "customers" ? "Guest Name" : "Name",
      "Details",
      "Status",
      section === "hotels" ? "Rating" : "Value",
      "Updated Date",
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.name,
      r.detail,
      r.status,
      r.value,
      r.date,
    ]);
    const dateStr = new Date().toISOString().split("T")[0];
    exportToExcel({
      filename: `${section}_export_${dateStr}`,
      sheetName: content.title.slice(0, 31),
      headers,
      rows,
    });
    setNotice(`Exported ${filtered.length} ${content.title.toLowerCase()} records to Excel.`);
  };

  return (
    <>
      <PageHeader
        section={section}
        notice={notice}
        onAction={onAction}
        actionAvailable={actionAvailable}
        onExportExcel={handleExportExcel}
      />
      {live && <Stats section={section} records={records} unavailable={loadFailed} />}
      {unsupportedMessage[section] && <div className="admin-inline-notice" role="status">{unsupportedMessage[section]}</div>}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>{`All ${content.title.toLowerCase()}`}</h2>
            <p>
              Showing {filtered.length === 0 ? "0" : `${(currentPage - 1) * pageSize + 1}–${Math.min(filtered.length, currentPage * pageSize)}`} of {formatNumber(filtered.length)} database record{filtered.length === 1 ? "" : "s"}{filtered.length !== records.length ? ` (filtered from ${records.length} total)` : ""}
            </p>
          </div>
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
            <thead><tr><th><input type="checkbox" aria-label="Select all rows" /></th><th>{section === "rooms" || section === "hotels" ? "IMAGE" : "ID"}</th><th>{section === "customers" ? "GUEST" : "NAME"}</th><th>DETAILS</th><th>STATUS</th><th>{section === "hotels" ? "RATING" : "VALUE"}</th><th>UPDATED</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={8}>Loading records…</td></tr> : paginatedRows.map((row) => (
              <tr key={row.id}>
                <td><input type="checkbox" aria-label={`Select ${row.name}`} /></td>
                <td className={section === "rooms" || section === "hotels" ? "admin-image-cell" : "admin-id"}>
                  {section === "rooms" || section === "hotels" ? (
                    row.image
                      ? <img className="admin-thumbnail" src={row.image} alt={`${row.name} ${section === "hotels" ? "hotel" : "room"}`} loading="lazy" />
                      : <span className="admin-thumbnail-empty" role="img" aria-label={`No ${section === "hotels" ? "hotel" : "room"} image available`}>No image</span>
                  ) : row.id}
                </td>
                <td>
                  {section === "hotels" && (isSuperAdmin || modPerm.edit) ? (
                    <Link href={`/admin/hotels/${encodeURIComponent(row.id)}`} className="admin-row-name">{row.name}</Link>
                  ) : (
                    <strong className="admin-row-name">{row.name}</strong>
                  )}
                </td>
                <td className="admin-detail-cell">{row.detail}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className="admin-value-cell">{row.value}</td>
                <td className="admin-date-cell">{row.date}</td>
                <td>
                  {section === "rooms" && (isSuperAdmin || modPerm.edit) ? (
                    <button className="admin-row-menu" type="button" onClick={() => {
                      if (!canPerform(api.getUser(), "rooms", "edit")) {
                        setNotice("You do not have permission to edit room records.");
                      } else if (row.room) setEditingRoom(row.room);
                      else setNotice(`Could not edit ${row.name}: room details are unavailable.`);
                    }}>
                      Edit
                    </button>
                  ) : null}
                  {(["hotels", "rooms", "departments", "offers"] as string[]).includes(section) && modPerm.delete ? (
                    <button className="admin-row-menu" type="button" aria-label={`Actions for ${row.name}`} onClick={() => void onRecordAction(row)}>
                      Remove
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
        <AdminPagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel={`${content.title.toLowerCase()} records`}
        />
      </section>
      {section === "hotels" && <div className="admin-footnote">StayEase Admin · All times in property local time</div>}
      {createOpen && (
        <CreateRecordDialog
          section={section}
          fields={createFields[section] || []}
          onClose={() => setCreateOpen(false)}
          onSubmit={(data, files) => void submitCreate(data, files)}
        />
      )}
      {editingRoom && (
        <CreateRecordDialog
          section="rooms"
          fields={createFields.rooms || []}
          initialValues={editingRoom}
          currentImage={editingRoom.image}
          title={`Edit ${editingRoom.name}`}
          submitLabel="Save changes"
          includeEmptyValues
          onClose={() => setEditingRoom(null)}
          onSubmit={(data, files) => void submitRoomEdit(data, files)}
        />
      )}
    </>
  );
}

function PageHeader({
  section,
  notice,
  onAction,
  actionAvailable = true,
  onExportExcel,
}: {
  section: AdminSection;
  notice: string;
  onAction: () => void;
  actionAvailable?: boolean;
  onExportExcel?: () => void;
}) {
  const content = sectionTitles[section];
  return (
    <div className="admin-page-heading">
      <div><div className="admin-eyebrow">WORKSPACE&nbsp; / &nbsp;{content.title.toUpperCase()}</div><h1>{content.title}</h1><p>{content.subtitle}</p></div>
      <div className="admin-heading-actions">
        {onExportExcel ? (
          <button
            type="button"
            className="admin-secondary-button"
            onClick={onExportExcel}
            title="Export to Excel (.xlsx)"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <DownloadIcon size={13} /> <span>Export to Excel</span>
          </button>
        ) : (
          <button type="button" className="admin-secondary-button" onClick={() => window.print()}>↓ <span>Export</span></button>
        )}
        {actionAvailable && (
          <button type="button" className="admin-primary-button" onClick={onAction}>
            ＋ {content.action}
          </button>
        )}
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
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  title?: string;
  multiple?: boolean;
};

function CreateRecordDialog({
  section,
  fields,
  initialValues,
  currentImage,
  title,
  submitLabel,
  includeEmptyValues = false,
  onClose,
  onSubmit,
}: {
  section: AdminSection;
  fields: CreateField[];
  initialValues?: Partial<AdminRoom>;
  currentImage?: string;
  title?: string;
  submitLabel?: string;
  includeEmptyValues?: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>, files: Record<string, File[]>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (initialValues) {
      return Object.fromEntries(fields
        .filter((field) => field.type !== "file")
        .map((field) => {
          const value = initialValues[field.name as keyof AdminRoom];
          return [field.name, Array.isArray(value) ? value.join(", ") : value == null ? "" : String(value)];
        }));
    }
    if (section === "housekeeping") {
      return { taskDate: new Date().toISOString().slice(0, 10), taskType: "CLEAN", priority: "NORMAL" };
    }
    if (section === "hotels" || section === "rooms") return { isActive: "true" };
    return {} as Record<string, string>;
  });
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [lookupOptions, setLookupOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [lookupErrors, setLookupErrors] = useState<string[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [reservationHotels, setReservationHotels] = useState<AdminHotel[]>([]);
  const [reservationRooms, setReservationRooms] = useState<AdminRoom[]>([]);
  const [employeeHotels, setEmployeeHotels] = useState<AdminHotel[]>([]);
  const [employeeDepartments, setEmployeeDepartments] = useState<AdminDepartment[]>([]);
  const [housekeepingHotels, setHousekeepingHotels] = useState<AdminHotel[]>([]);
  const [housekeepingRooms, setHousekeepingRooms] = useState<AdminRoom[]>([]);
  const [housekeepingReservations, setHousekeepingReservations] = useState<AdminBooking[]>([]);

  useEffect(() => {
    let active = true;
    const lookups: [string, string, Promise<{ value: string; label: string }[]>][] = [];
    if (["rooms", "departments"].includes(section)) {
      lookups.push(["hotelId", "hotels", api.getAdminHotels().then((rows) =>
        rows.filter((hotel) => section !== "rooms" || initialValues || hotel.isActive).map((hotel) => ({ value: hotel.slug || hotel._id, label: `${hotel.name} · ${hotel.city}` })),
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
      lookups.push(["hotelId", "hotels", api.getAdminHotels().then((rows) => {
        if (active) setEmployeeHotels(rows);
        return rows.map((hotel) => ({ value: hotel.slug || hotel._id, label: `${hotel.name} · ${hotel.city}` }));
      })]);
      lookups.push(["departmentId", "departments", api.getAdminDepartments().then((rows) => {
        if (active) setEmployeeDepartments(rows);
        return rows.map((department) => ({ value: department._id, label: department.name }));
      })]);
    }
    if (section === "housekeeping") {
      lookups.push(["hotelId", "hotels", api.getAdminHotels().then((rows) => {
        if (active) setHousekeepingHotels(rows);
        return rows.map((hotel) => ({ value: hotel.slug || hotel._id, label: `${hotel.name} · ${hotel.city || hotel.slug}` }));
      })]);
      lookups.push(["roomNumber", "rooms", api.getAdminRooms().then((rows) => {
        if (active) setHousekeepingRooms(rows);
        return rows.map((room) => ({ value: room.name, label: `${room.name} · ${room.hotelId}` }));
      })]);
      lookups.push(["assignedTo", "employees", api.getAdminEmployees().then((rows) =>
        rows.map((employee) => ({ value: employee.employeeCode || employee.id, label: `${employee.name} · ${employee.position}` })),
      )]);
      api.getAdminReservations().then((res) => {
        if (active && res?.bookings) setHousekeepingReservations(res.bookings);
      }).catch(() => { });
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

  const employeeDepartmentOptions = useMemo(() => {
    if (section !== "employees") return [];
    const selectedHotelId = values.hotelId;
    if (!selectedHotelId) return [];
    const selectedHotel = employeeHotels.find(
      (h) => (h.slug || h._id) === selectedHotelId || h._id === selectedHotelId || h.slug === selectedHotelId,
    );
    return employeeDepartments
      .filter((dept) => {
        if (selectedHotel) {
          return dept.hotelId === selectedHotel.slug || dept.hotelId === selectedHotel._id || dept.hotelId === selectedHotelId;
        }
        return dept.hotelId === selectedHotelId;
      })
      .map((dept) => ({
        value: dept._id,
        label: dept.isActive === false ? `${dept.name} (Inactive)` : dept.name,
      }));
  }, [section, values.hotelId, employeeHotels, employeeDepartments]);

  const housekeepingRoomOptions = useMemo(() => {
    if (section !== "housekeeping") return [];
    const selectedHotelId = values.hotelId;
    if (!selectedHotelId) return [];
    const selectedHotel = housekeepingHotels.find(
      (h) => (h.slug || h._id) === selectedHotelId || h._id === selectedHotelId || h.slug === selectedHotelId,
    );
    return housekeepingRooms
      .filter((room) => {
        if (selectedHotel) {
          return room.hotelId === selectedHotel.slug || room.hotelId === selectedHotel._id || room.hotelId === selectedHotelId;
        }
        return room.hotelId === selectedHotelId;
      })
      .map((room) => ({
        value: room.name,
        label: `${room.name} (${room.capacity} guests)`,
      }));
  }, [section, values.hotelId, housekeepingHotels, housekeepingRooms]);

  const selectedHousekeepingHotel = useMemo(() => {
    if (section !== "housekeeping" || !values.hotelId) return null;
    return (
      housekeepingHotels.find(
        (h) => (h.slug || h._id) === values.hotelId || h._id === values.hotelId || h.slug === values.hotelId,
      ) || null
    );
  }, [section, values.hotelId, housekeepingHotels]);

  const selectedHousekeepingRoom = useMemo(() => {
    if (section !== "housekeeping" || !values.roomNumber) return null;
    return (
      housekeepingRooms.find(
        (r) =>
          r.name === values.roomNumber &&
          (selectedHousekeepingHotel
            ? r.hotelId === selectedHousekeepingHotel.slug ||
            r.hotelId === selectedHousekeepingHotel._id ||
            r.hotelId === values.hotelId
            : true),
      ) || null
    );
  }, [section, values.roomNumber, selectedHousekeepingHotel, housekeepingRooms, values.hotelId]);

  const matchedGuest = useMemo(() => {
    if (section !== "housekeeping" || !values.hotelId || !values.roomNumber || !values.taskDate) return null;
    const dateStr = values.taskDate.slice(0, 10);
    return (
      housekeepingReservations.find((b) => {
        if (b.status === "CANCELLED" || b.status === "EXPIRED") return false;
        const hotelMatch =
          b.hotel_id === values.hotelId ||
          (selectedHousekeepingHotel &&
            (b.hotel_id === selectedHousekeepingHotel.slug ||
              b.hotel_id === selectedHousekeepingHotel._id ||
              b.hotel_name.toLowerCase() === selectedHousekeepingHotel.name.toLowerCase()));
        if (!hotelMatch) return false;

        const roomMatch =
          (b.room_type_name && b.room_type_name.toLowerCase() === values.roomNumber.toLowerCase()) ||
          (selectedHousekeepingRoom && b.room_type_id === selectedHousekeepingRoom._id);
        if (!roomMatch) return false;

        const checkIn = b.check_in_date.slice(0, 10);
        const checkOut = b.check_out_date.slice(0, 10);
        return dateStr >= checkIn && dateStr <= checkOut;
      }) || null
    );
  }, [
    section,
    values.hotelId,
    values.roomNumber,
    values.taskDate,
    housekeepingReservations,
    selectedHousekeepingHotel,
    selectedHousekeepingRoom,
  ]);

  const requiredLookupsReady = fields
    .filter((field) => field.required && ["hotelId", "departmentId", "roomTypeId", "roomNumber"].includes(field.name))
    .every((field) => {
      if (field.name === "roomTypeId" && section === "reservations") {
        return Boolean(values.hotelId && reservationRoomOptions.length > 0);
      }
      if (field.name === "departmentId" && section === "employees") {
        return Boolean(values.hotelId && employeeDepartmentOptions.length > 0);
      }
      if (field.name === "roomNumber" && section === "housekeeping") {
        return Boolean(values.hotelId && housekeepingRoomOptions.length > 0);
      }
      return Boolean(lookupOptions[field.name]?.length);
    });
  const hasRequiredLookups = fields.some((field) => field.required && ["hotelId", "departmentId", "roomTypeId", "roomNumber"].includes(field.name));
  const missingRequiredOptions = fields.some((field) => {
    if (field.name === "roomTypeId" && section === "reservations") {
      return Boolean(values.hotelId && reservationRoomOptions.length === 0);
    }
    if (field.name === "departmentId" && section === "employees") {
      return Boolean(values.hotelId && employeeDepartmentOptions.length === 0);
    }
    if (field.name === "roomNumber" && section === "housekeeping") {
      return Boolean(values.hotelId && housekeepingRoomOptions.length === 0);
    }
    return field.required && ["hotelId", "departmentId", "roomNumber"].includes(field.name) && !lookupOptions[field.name]?.length;
  });

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-dialog" onSubmit={(event) => {
        event.preventDefault();
        const data: Record<string, unknown> = Object.fromEntries(Object.entries(values).filter(([, value]) => includeEmptyValues || value !== ""));
        for (const field of ["basePrice", "price", "capacity", "totalInventory", "salary", "guestsCount", "roomCount", "discountValue"]) {
          if (data[field] !== undefined) data[field] = Number(data[field]);
        }
        for (const field of fields) {
          const value = data[field.name];
          if (field.type === "number" && value !== undefined) data[field.name] = Number(value);
          if (field.type === "list" && typeof value === "string") {
            data[field.name] = value.split(",").map((item) => item.trim()).filter(Boolean);
          }
          if (field.name === "isActive" && typeof data[field.name] === "string") {
            data[field.name] = data[field.name] === "true";
          }
        }
        if (section === "housekeeping") {
          if (matchedGuest) {
            data.guestName = `${matchedGuest.guest_first_name} ${matchedGuest.guest_last_name}`.trim();
            data.guestEmail = matchedGuest.guest_email || "";
            data.guestPhone = matchedGuest.guest_phone || "";
            data.bookingReference = matchedGuest.booking_code || "";
            data.checkInDate = matchedGuest.check_in_date;
            data.checkOutDate = matchedGuest.check_out_date;
          } else {
            data.guestName = "Vacant";
          }
        }
        onSubmit(data, files);
      }}>
        <div className="admin-dialog-heading"><div><span className="admin-eyebrow">{initialValues ? "EDIT RECORD" : "NEW RECORD"}</span><h2>{title || sectionTitles[section].action}</h2></div><button type="button" className="admin-row-menu" aria-label="Close dialog" onClick={onClose}>×</button></div>
        <div className="admin-dialog-fields">
          {fields.map((field) => {
            const isReservationRoom = field.name === "roomTypeId" && section === "reservations";
            const isEmployeeDept = field.name === "departmentId" && section === "employees";
            const isHousekeepingRoom = field.name === "roomNumber" && section === "housekeeping";
            const options = isReservationRoom
              ? reservationRoomOptions
              : isEmployeeDept
                ? employeeDepartmentOptions
                : isHousekeepingRoom
                  ? housekeepingRoomOptions
                  : lookupOptions[field.name];
            return (
              <label key={field.name}>{field.label}
                {field.type === "file" ? (
                  <>
                    {field.name === "imageFile" && currentImage ? (
                      <img className="admin-thumbnail" src={currentImage} alt="Current room" />
                    ) : null}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple={field.multiple}
                      onChange={(event) => setFiles((current) => ({
                        ...current,
                        [field.name]: Array.from(event.target.files || []),
                      }))}
                    />
                    {files[field.name]?.length ? (
                      <small>{files[field.name].map((file) => file.name).join(", ")}</small>
                    ) : null}
                  </>
                ) : field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    placeholder={field.placeholder}
                    value={values[field.name] || ""}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  />
                ) : options ? (
                  <select
                    required={field.required}
                    value={values[field.name] || ""}
                    disabled={(isReservationRoom || isEmployeeDept || isHousekeepingRoom) && !values.hotelId}
                    onChange={(event) => {
                      const val = event.target.value;
                      setValues((current) => ({
                        ...current,
                        [field.name]: val,
                        ...(field.name === "hotelId" && section === "reservations" ? { roomTypeId: "" } : {}),
                        ...(field.name === "hotelId" && section === "employees" ? { departmentId: "" } : {}),
                        ...(field.name === "hotelId" && section === "housekeeping" ? { roomNumber: "" } : {}),
                      }));
                    }}
                  >
                    <option value="">
                      {loadingLookups
                        ? "Loading choices…"
                        : (isReservationRoom || isEmployeeDept || isHousekeepingRoom) && !values.hotelId
                          ? "Select a hotel first"
                          : isReservationRoom && options.length === 0
                            ? "No rooms available for this hotel"
                            : isEmployeeDept && options.length === 0
                              ? "No departments for this hotel"
                              : isHousekeepingRoom && options.length === 0
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
                    type={field.type === "list" ? "text" : field.type || "text"}
                    min={field.min}
                    max={field.max}
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
        {section === "housekeeping" && values.hotelId && values.roomNumber && values.taskDate && (
          <div className={`admin-occupancy-card ${matchedGuest ? "is-occupied" : "is-vacant"}`}>
            <div className="admin-occupancy-card-header">
              <span className="admin-occupancy-title">Guest Occupancy ({values.taskDate})</span>
              {matchedGuest ? (
                <span
                  className={`admin-occupancy-badge ${values.taskDate.slice(0, 10) === matchedGuest.check_in_date.slice(0, 10)
                    ? "arriving"
                    : values.taskDate.slice(0, 10) === matchedGuest.check_out_date.slice(0, 10)
                      ? "departing"
                      : "occupied"
                    }`}
                >
                  {values.taskDate.slice(0, 10) === matchedGuest.check_in_date.slice(0, 10)
                    ? "Arriving today"
                    : values.taskDate.slice(0, 10) === matchedGuest.check_out_date.slice(0, 10)
                      ? "Departing today"
                      : "In-House (Stayover)"}
                </span>
              ) : (
                <span className="admin-occupancy-badge vacant">Vacant</span>
              )}
            </div>
            {matchedGuest ? (
              <div className="admin-occupancy-grid">
                <div className="admin-occupancy-item">
                  <span className="admin-occupancy-label">Guest</span>
                  <span className="admin-occupancy-val">{matchedGuest.guest_first_name} {matchedGuest.guest_last_name}</span>
                </div>
                <div className="admin-occupancy-item">
                  <span className="admin-occupancy-label">Booking Reference</span>
                  <span className="admin-occupancy-val">{matchedGuest.booking_code}</span>
                </div>
                <div className="admin-occupancy-item">
                  <span className="admin-occupancy-label">Contact</span>
                  <span className="admin-occupancy-val">{matchedGuest.guest_email || "—"}{matchedGuest.guest_phone ? ` · ${matchedGuest.guest_phone}` : ""}</span>
                </div>
                <div className="admin-occupancy-item">
                  <span className="admin-occupancy-label">Stay Window</span>
                  <span className="admin-occupancy-val">{matchedGuest.check_in_date} → {matchedGuest.check_out_date}</span>
                </div>
              </div>
            ) : (
              <p style={{ margin: "4px 0 0", color: "#617169", fontSize: "9px" }}>
                Room is vacant. No active guest reservation occupying this room on this date.
              </p>
            )}
          </div>
        )}
        <div className="admin-dialog-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="admin-primary-button" disabled={loadingLookups || !requiredLookupsReady}>{submitLabel || "Save record"}</button></div>
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

  function handleExportExcel() {
    const todayStr = new Date().toISOString().split("T")[0];
    const headers = ["Category", "Item / Property", "Details", "Metric / Status", "Notes"];
    const rows: (string | number)[][] = [
      ["METRICS", "Properties", "Hotel database", overview?.hotels?.length ?? 0, "Connected hotels"],
      ["METRICS", "Room Inventory", "Room database", overview?.rooms?.reduce((sum, room) => sum + room.totalInventory, 0) ?? 0, "Total rooms across all properties"],
      ["METRICS", "Reservations", "Booking database", overview?.reservations?.length ?? 0, "Total bookings"],
      ["METRICS", "Team Members", "Employee database", overview?.employees?.length ?? 0, "Total staff"],
      ["METRICS", "Open Housekeeping", "Housekeeping database", overview?.tasks?.filter((task) => task.status !== "INSPECTED").length ?? 0, "Pending tasks"],
      ["METRICS", "Guest Rating", "Average from properties", overview?.hotels?.length ? (overview.hotels.reduce((sum, hotel) => sum + hotel.rating, 0) / overview.hotels.length).toFixed(1) : "—", "Out of 5.0"],
      ["", "", "", "", ""],
      ["ROOM INVENTORY", "Property", "Room Types", "Total Rooms", "Status"],
    ];

    if (overview?.rooms && overview.hotels) {
      for (const [hotelId, inventory] of roomInventory.entries()) {
        const hotel = overview.hotels.find((item) => item.slug === hotelId || item._id === hotelId);
        rows.push([
          "ROOM INVENTORY",
          hotel?.name || hotelId,
          `${inventory.types} types`,
          inventory.rooms,
          "Active Property",
        ]);
      }
    }

    rows.push(["", "", "", "", ""]);
    rows.push(["RECENT RESERVATIONS", "Guest Name", "Hotel & Room", "Amount", "Status"]);

    if (overview?.reservations) {
      for (const b of overview.reservations.slice(0, 50)) {
        rows.push([
          "RECENT RESERVATIONS",
          `${b.guest_first_name} ${b.guest_last_name}`,
          `${b.hotel_name} · ${b.room_type_name}`,
          `₹${b.total_price.toLocaleString("en-IN")}`,
          b.status,
        ]);
      }
    }

    exportToExcel({
      filename: `dashboard_overview_${todayStr}`,
      sheetName: "Workspace Overview",
      headers,
      rows,
    });
    setNotice("Exported workspace overview to Excel.");
  }

  return (
    <>
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow">{today}&nbsp; · &nbsp;DATABASE OVERVIEW</div><h1>Workspace overview</h1><p>Counts below come from connected service databases.</p></div>
        <div className="admin-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleExportExcel}
            title="Export workspace summary to Excel (.xlsx)"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <DownloadIcon size={13} /> <span>Export to Excel</span>
          </button>
          <button type="button" className="admin-secondary-button" onClick={() => window.print()}>Print</button>
        </div>
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
  const [periodMonths, setPeriodMonths] = useState<6 | 12>(6);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getAdminReservations(), api.getAdminPayments()]).then(([bookingResult, paymentResult]) => {
      if (!active) return;
      if (bookingResult.status === "fulfilled") setBookings(bookingResult.value.bookings);
      if (paymentResult.status === "fulfilled") setPayments(paymentResult.value);
      const failures = [bookingResult, paymentResult].filter((result) => result.status === "rejected").length;
      if (failures) setError(`${failures} data source${failures === 1 ? "" : "s"} could not be reached.`);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const monthBuckets = useMemo(() => {
    const now = new Date();
    return Array.from({ length: periodMonths }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - periodMonths + index + 1, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-IN", periodMonths === 12 ? { month: "short", year: "2-digit" } : { month: "short" }),
      };
    });
  }, [periodMonths]);
  const monthKeys = useMemo(() => new Set(monthBuckets.map((month) => month.key)), [monthBuckets]);
  const periodBookings = useMemo(
    () => bookings?.filter((booking) => monthKeys.has(reportMonthKey(booking.created_at || booking.check_in_date))) ?? null,
    [bookings, monthKeys],
  );
  const periodPayments = useMemo(
    () => payments?.filter((payment) => monthKeys.has(reportMonthKey(payment.createdAt))) ?? null,
    [payments, monthKeys],
  );
  const monthlyData = useMemo(() => {
    const monthIndex = new Map(monthBuckets.map((month, index) => [month.key, index]));
    const rows = monthBuckets.map((month) => ({ ...month, bookings: 0, revenue: 0 }));
    for (const booking of periodBookings || []) {
      const index = monthIndex.get(reportMonthKey(booking.created_at || booking.check_in_date));
      if (index !== undefined) rows[index].bookings += 1;
    }
    for (const payment of periodPayments || []) {
      const index = monthIndex.get(reportMonthKey(payment.createdAt));
      if (index !== undefined) rows[index].revenue += netCollectedPayment(payment);
    }
    return rows;
  }, [monthBuckets, periodBookings, periodPayments]);

  const netRevenue = periodPayments?.reduce((sum, payment) => sum + netCollectedPayment(payment), 0);
  const averageBookingValue = periodBookings?.length
    ? periodBookings.reduce((sum, booking) => sum + booking.total_price, 0) / periodBookings.length
    : null;
  const reservationStatuses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const booking of periodBookings || []) {
      const status = booking.status.replaceAll("_", " ");
      counts.set(status, (counts.get(status) || 0) + 1);
    }
    return Array.from(counts, ([label, value], index) => ({
      label,
      value,
      color: reportStatusColor(label, index),
    }));
  }, [periodBookings]);
  const paymentStatuses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const payment of periodPayments || []) {
      const status = payment.status.replaceAll("_", " ");
      counts.set(status, (counts.get(status) || 0) + 1);
    }
    return Array.from(counts, ([label, value], index) => ({
      label,
      value,
      color: reportStatusColor(label, index),
    }));
  }, [periodPayments]);
  const propertyRevenue = useMemo(() => {
    const bookingByReference = new Map<string, AdminBooking>();
    for (const booking of periodBookings || []) {
      bookingByReference.set(booking.id.toLowerCase(), booking);
      bookingByReference.set(booking.booking_code.toLowerCase(), booking);
    }
    const totals = new Map<string, number>();
    for (const payment of periodPayments || []) {
      const booking = bookingByReference.get(payment.bookingId?.toLowerCase() || "")
        || bookingByReference.get(payment.bookingCode.toLowerCase());
      const propertyName = booking?.hotel_name || payment.metadata?.hotelName;
      const amount = netCollectedPayment(payment);
      if (!propertyName || amount <= 0) continue;
      totals.set(propertyName, (totals.get(propertyName) || 0) + amount);
    }
    return Array.from(totals, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [periodBookings, periodPayments]);
  const roomTypeDemand = useMemo(() => {
    const counts = new Map<string, number>();
    for (const booking of periodBookings || []) {
      counts.set(booking.room_type_name, (counts.get(booking.room_type_name) || 0) + 1);
    }
    return Array.from(counts, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [periodBookings]);
  const currentUser = api.getUser();
  const isPortfolioAdmin = currentUser?.role === "ADMIN" || currentUser?.email?.toLowerCase() === "mala@gmail.com";

  function handleExportExcel() {
    const todayStr = new Date().toISOString().split("T")[0];
    const headers = ["Booking Code", "Guest Name", "Hotel", "Room Type", "Status", "Amount (INR)", "Check-in", "Check-out"];
    const rows: (string | number)[][] = (periodBookings || []).map((b) => [
      b.booking_code,
      `${b.guest_first_name} ${b.guest_last_name}`,
      b.hotel_name,
      b.room_type_name,
      b.status,
      b.total_price,
      b.check_in_date,
      b.check_out_date,
    ]);
    exportToExcel({
      filename: `reports_summary_${todayStr}`,
      sheetName: "Summary Report",
      headers,
      rows,
    });
  }

  return <>
    <PageHeader section="reports" notice={error} onAction={() => window.print()} actionAvailable={false} onExportExcel={handleExportExcel} />
    <div className="reports-toolbar">
      <div>
        <strong>{isPortfolioAdmin ? "Portfolio analytics" : "Property analytics"}</strong>
        <span>{isPortfolioAdmin ? "All properties · live reservation and payment data" : "Scoped to the properties assigned to your account"}</span>
      </div>
      <label className="reports-period">Period
        <select value={periodMonths} onChange={(event) => setPeriodMonths(event.target.value === "12" ? 12 : 6)}>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </label>
    </div>

    <div className="reports-kpi-grid">
      <ReportMetric label="Reservations" value={periodBookings ? formatNumber(periodBookings.length) : loading ? "Loading…" : "Unavailable"} detail={`${periodMonths}-month period`} />
      <ReportMetric label="Net collected revenue" value={netRevenue === undefined ? loading ? "Loading…" : "Unavailable" : formatReportCurrency(netRevenue)} detail="Successful payments less refunds" />
      <ReportMetric label="Payment records" value={periodPayments ? formatNumber(periodPayments.length) : loading ? "Loading…" : "Unavailable"} detail={`${periodMonths}-month period`} />
      <ReportMetric label="Average booking value" value={averageBookingValue === null ? periodBookings ? "—" : loading ? "Loading…" : "Unavailable" : formatReportCurrency(averageBookingValue)} detail="Reservation value per booking" />
    </div>

    <div className="reports-chart-grid">
      <section className="admin-panel reports-panel reports-panel-wide">
        <div className="admin-panel-heading"><div><h2>Collected revenue trend</h2><p>Monthly net payments after successful refunds</p></div></div>
        {periodPayments === null
          ? <div className="admin-empty">{loading ? "Loading payment data…" : "Payment data is unavailable."}</div>
          : periodPayments.length
            ? <RevenueAreaChart data={monthlyData} />
            : <div className="admin-empty">No payments are recorded for this period.</div>}
      </section>
      <section className="admin-panel reports-panel">
        <div className="admin-panel-heading"><div><h2>Reservation status</h2><p>Bookings by current status</p></div></div>
        {periodBookings === null
          ? <div className="admin-empty">{loading ? "Loading reservation data…" : "Reservation data is unavailable."}</div>
          : <ReportDonut segments={reservationStatuses} centerLabel="Bookings" />}
      </section>
      <section className="admin-panel reports-panel reports-panel-wide">
        <div className="admin-panel-heading"><div><h2>Reservation activity</h2><p>Bookings created in each month</p></div></div>
        {periodBookings === null
          ? <div className="admin-empty">{loading ? "Loading reservation data…" : "Reservation data is unavailable."}</div>
          : periodBookings.length
            ? <MonthlyBookingBars data={monthlyData} />
            : <div className="admin-empty">No reservations are recorded for this period.</div>}
      </section>
      <section className="admin-panel reports-panel">
        <div className="admin-panel-heading"><div><h2>Payment status</h2><p>Transaction records by status</p></div></div>
        {periodPayments === null
          ? <div className="admin-empty">{loading ? "Loading payment data…" : "Payment data is unavailable."}</div>
          : <ReportDonut segments={paymentStatuses} centerLabel="Payments" />}
      </section>
      <section className="admin-panel reports-panel">
        <div className="admin-panel-heading"><div><h2>Collected by property</h2><p>Net payment totals for your available property data</p></div></div>
        {periodPayments === null
          ? <div className="admin-empty">{loading ? "Loading payment data…" : "Payment data is unavailable."}</div>
          : propertyRevenue.length
            ? <ReportHorizontalBars items={propertyRevenue} formatValue={formatReportCurrency} />
            : <div className="admin-empty">No property-level payment totals are available for this period.</div>}
      </section>
      <section className="admin-panel reports-panel">
        <div className="admin-panel-heading"><div><h2>Room type demand</h2><p>Reservations by room type</p></div></div>
        {periodBookings === null
          ? <div className="admin-empty">{loading ? "Loading reservation data…" : "Reservation data is unavailable."}</div>
          : roomTypeDemand.length
            ? <ReportHorizontalBars items={roomTypeDemand} formatValue={formatNumber} />
            : <div className="admin-empty">No room type demand is available for this period.</div>}
      </section>
    </div>
    <p className="reports-footnote">All charts use live records from the reservation and payment services. Failed sources are marked unavailable; no sample values are added.</p>
  </>;
}

function reportMonthKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function netCollectedPayment(payment: AdminPayment) {
  const status = payment.status.toUpperCase();
  if (status !== "SUCCESS" && status !== "REFUNDED") return 0;
  const amount = Number.isFinite(payment.amount) ? Math.max(0, payment.amount) : 0;
  const refundedAmount = (payment.refunds || [])
    .filter((refund) => refund.status.toUpperCase() === "SUCCESS")
    .reduce((sum, refund) => sum + refund.amount, 0);
  const effectiveRefund = status === "REFUNDED" && refundedAmount === 0 ? amount : refundedAmount;
  return Math.max(0, amount - effectiveRefund);
}

function formatReportCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function reportStatusColor(label: string, index: number) {
  const statusColors: Record<string, string> = {
    CONFIRMED: "#176b58",
    "PENDING PAYMENT": "#d2a451",
    "CHECKED IN": "#648da4",
    "CHECKED OUT": "#86a294",
    CANCELLED: "#bd7062",
    REFUNDED: "#927aa5",
    SUCCESS: "#176b58",
    FAILED: "#bd7062",
    PENDING: "#d2a451",
    EXPIRED: "#a7b3ad",
  };
  return statusColors[label.toUpperCase()] || ["#176b58", "#d2a451", "#648da4", "#927aa5", "#bd7062", "#86a294"][index % 6];
}

function ReportMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="admin-stat-card reports-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

type ReportMonthlyDatum = { key: string; label: string; bookings: number; revenue: number };
type ReportSegment = { label: string; value: number; color: string };
type ReportBarItem = { label: string; value: number };

function RevenueAreaChart({ data }: { data: ReportMonthlyDatum[] }) {
  const width = 720;
  const height = 250;
  const left = 54;
  const right = 18;
  const top = 14;
  const bottom = 34;
  const plotHeight = height - top - bottom;
  const plotWidth = width - left - right;
  const maximum = Math.max(...data.map((item) => item.revenue), 1);
  const points = data.map((item, index) => ({
    ...item,
    x: left + (data.length < 2 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
    y: top + plotHeight - (item.revenue / maximum) * plotHeight,
  }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`;

  return (
    <div className="reports-area-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly net collected revenue">
        <defs>
          <linearGradient id="reports-revenue-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#176b58" stopOpacity=".24" />
            <stop offset="100%" stopColor="#176b58" stopOpacity=".015" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = top + plotHeight - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e9efec" strokeDasharray="3 4" />
              <text x={left - 8} y={y + 3} textAnchor="end" className="reports-axis-label">
                {formatCompactCurrency(maximum * ratio)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#reports-revenue-fill)" />
        <path d={linePath} fill="none" stroke="#176b58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#176b58" strokeWidth="2" />
            <title>{point.label}: {formatReportCurrency(point.revenue)}</title>
            <text x={point.x} y={height - 8} textAnchor="middle" className="reports-axis-label">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function formatCompactCurrency(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${Math.round(value)}`;
}

function MonthlyBookingBars({ data }: { data: ReportMonthlyDatum[] }) {
  const maximum = Math.max(...data.map((item) => item.bookings), 1);
  return (
    <div className="reports-monthly-bars" role="img" aria-label="Monthly reservations">
      {data.map((item) => (
        <div className="reports-month-column" key={item.key} title={`${item.label}: ${formatNumber(item.bookings)} reservations`}>
          <span className="reports-month-value">{item.bookings || ""}</span>
          <div className="reports-month-track">
            <span style={{ height: `${item.bookings ? Math.max(4, (item.bookings / maximum) * 100) : 0}%` }} />
          </div>
          <span className="reports-month-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ReportDonut({ segments, centerLabel }: { segments: ReportSegment[]; centerLabel: string }) {
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  const total = visibleSegments.reduce((sum, segment) => sum + segment.value, 0);
  let cumulative = 0;
  const gradient = total
    ? visibleSegments.map((segment) => {
      const start = (cumulative / total) * 100;
      cumulative += segment.value;
      return `${segment.color} ${start}% ${(cumulative / total) * 100}%`;
    }).join(", ")
    : "#edf1ef 0% 100%";

  return (
    <div className="reports-donut-layout">
      <div className="reports-donut" role="img" aria-label={`${centerLabel}: ${formatNumber(total)}`}>
        <div className="reports-donut-hole">
          <strong>{formatNumber(total)}</strong>
          <span>{centerLabel}</span>
        </div>
        <span className="reports-donut-pie" style={{ background: `conic-gradient(${gradient})` }} />
      </div>
      {visibleSegments.length ? (
        <ul className="reports-legend">
          {visibleSegments.map((segment) => (
            <li key={segment.label}>
              <span><i style={{ backgroundColor: segment.color }} />{segment.label}</span>
              <strong>{formatNumber(segment.value)}</strong>
            </li>
          ))}
        </ul>
      ) : <p className="reports-chart-empty">No records in this period.</p>}
    </div>
  );
}

function ReportHorizontalBars({ items, formatValue }: { items: ReportBarItem[]; formatValue: (value: number) => string }) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="reports-horizontal-bars" role="img" aria-label="Ranked report values">
      {items.map((item, index) => (
        <div className="reports-horizontal-row" key={item.label} title={`${item.label}: ${formatValue(item.value)}`}>
          <div className="reports-horizontal-heading"><span>{item.label}</span><strong>{formatValue(item.value)}</strong></div>
          <div className="reports-horizontal-track">
            <span className={index === 0 ? "is-primary" : ""} style={{ width: `${(item.value / maximum) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = /active|confirmed|paid|available|published|completed|checked in|clean|inspected/i.test(status) ? "green" : /pending|scheduled|reply|occupied|unread|in progress/i.test(status) ? "amber" : /cancel|refund|maintenance|flagged|leave|expired|dirty/i.test(status) ? "rose" : "gray";
  return <span className={`admin-status status-${tone}`}><i />{status}</span>;
}

function ToggleRow(_props: { title: string; detail: string }) {
  return null;
}

