"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  api,
  type AdminBooking,
  type AdminHotel,
  type AdminRoom,
} from "@/lib/api-client";
import { exportToExcel } from "@/lib/export-excel";
import { getEffectivePermissions } from "@/lib/rbac";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { RoomAvailabilityCalendar } from "@/components/room-availability-calendar";
import {
  BuildingIcon,
  BedIcon,
  CalendarIcon,
  FilterIcon,
  CreditCardIcon,
  PrinterIcon,
  ReceiptIcon,
  DownloadIcon,
  RefreshIcon,
  PlusIcon,
  CheckIcon,
  ReactLogo,
  NextjsLogo,
} from "@/components/icons";

export function ReservationsWorkspace() {
  const modPerm = useMemo(() => {
    return getEffectivePermissions(api.getUser()).reservations;
  }, []);

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [cancellingCode, setCancellingCode] = useState("");

  // Filter States (All Multiple Selection)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateField, setDateField] = useState<"booking" | "checkin" | "checkout">("booking");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "upcoming" | "7days" | "month" | "custom">("all");

  // Dropdown Open States
  const [hotelDropdownOpen, setHotelDropdownOpen] = useState(false);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const hotelRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // New Reservation Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [availableHotels, setAvailableHotels] = useState<AdminHotel[]>([]);
  const [availableRooms, setAvailableRooms] = useState<AdminRoom[]>([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    hotelId: "",
    roomTypeId: "",
    checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    guestsCount: 1,
    roomCount: 1,
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    specialRequests: "",
  });

  // Room Modification Dialog State
  const [roomEditOpen, setRoomEditOpen] = useState(false);
  const [roomEditBooking, setRoomEditBooking] = useState<AdminBooking | null>(null);
  const [roomEditNewCount, setRoomEditNewCount] = useState(1);
  const [roomEditPaymentMethod, setRoomEditPaymentMethod] = useState<"Instant UPI QR" | "Credit / Debit card" | "Cash at Front Desk" | "Bank Transfer">("Instant UPI QR");
  const [roomEditProcessing, setRoomEditProcessing] = useState(false);
  const [roomEditSuccess, setRoomEditSuccess] = useState<{ message: string; billNumber?: string } | null>(null);
  const [roomEditError, setRoomEditError] = useState("");

  // Transaction input details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvv: "",
    authCode: "",
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: "HDFC Bank",
    accountNumber: "",
    utrNumber: "",
    transferDate: new Date().toISOString().split("T")[0],
  });
  const [cashDetails, setCashDetails] = useState({
    receiptNumber: "",
    collectedBy: "",
  });
  const [upiDetails, setUpiDetails] = useState({
    upiRefNumber: "",
  });

  const roomEditFinancials = useMemo(() => {
    if (!roomEditBooking) return null;
    const nights = roomEditBooking.total_nights || 1;
    const oldCount = roomEditBooking.room_count || 1;
    const oldTotal = roomEditBooking.total_price || 0;
    const rate = roomEditBooking.room_price_per_night || (nights > 0 && oldCount > 0 ? (oldTotal / 1.12) / (nights * oldCount) : 0);
    const newCount = Math.max(1, roomEditNewCount);
    const newSubtotal = Math.round(rate * nights * newCount * 100) / 100;
    const newTaxes = Math.round(newSubtotal * 0.12 * 100) / 100;
    const newTotal = Math.round((newSubtotal + newTaxes) * 100) / 100;
    const diff = Math.round((newTotal - oldTotal) * 100) / 100;
    return { nights, rate, oldCount, oldTotal, newCount, newSubtotal, newTaxes, newTotal, diff };
  }, [roomEditBooking, roomEditNewCount]);

  async function handleExecuteRoomModification() {
    if (!roomEditBooking || !roomEditFinancials) return;
    setRoomEditProcessing(true);
    setRoomEditError("");
    setRoomEditSuccess(null);
    try {
      let billNum = "";
      let effectivePaymentMethod = roomEditPaymentMethod as string;
      if (roomEditPaymentMethod === "Credit / Debit card") {
        const cleanCard = cardDetails.cardNumber.replace(/\s+/g, "");
        const last4 = cleanCard ? cleanCard.slice(-4) : "4242";
        const auth = cardDetails.authCode ? ` (Auth: ${cardDetails.authCode})` : "";
        effectivePaymentMethod = `Card ending in ${last4}${auth}`;
      } else if (roomEditPaymentMethod === "Bank Transfer") {
        const utr = bankDetails.utrNumber ? ` (UTR: ${bankDetails.utrNumber})` : "";
        effectivePaymentMethod = `Bank Transfer ${bankDetails.bankName}${utr}`;
      } else if (roomEditPaymentMethod === "Instant UPI QR") {
        const ref = upiDetails.upiRefNumber ? ` (Ref: ${upiDetails.upiRefNumber})` : "";
        effectivePaymentMethod = `UPI Payment${ref}`;
      } else if (roomEditPaymentMethod === "Cash at Front Desk") {
        const rec = cashDetails.receiptNumber ? ` (Receipt: ${cashDetails.receiptNumber})` : "";
        effectivePaymentMethod = `Cash at Desk${rec}`;
      }

      if (roomEditFinancials.diff > 0) {
        const intentRes = await api.createPaymentIntent(
          roomEditBooking.id,
          roomEditBooking.booking_code,
          roomEditFinancials.diff,
          effectivePaymentMethod
        );
        const confirmRes = await api.confirmPaymentIntent({
          paymentId: intentRes.paymentId,
          paymentMethod: effectivePaymentMethod,
          hotelName: roomEditBooking.hotel_name,
          roomTypeName: roomEditBooking.room_type_name,
          guestName: `${roomEditBooking.guest_first_name} ${roomEditBooking.guest_last_name}`.trim(),
          guestEmail: roomEditBooking.guest_email,
          guestPhone: roomEditBooking.guest_phone,
          checkInDate: roomEditBooking.check_in_date,
          checkOutDate: roomEditBooking.check_out_date,
          totalNights: roomEditFinancials.nights,
          roomCount: roomEditFinancials.newCount,
          subtotal: roomEditFinancials.newSubtotal,
          taxesAndFees: roomEditFinancials.newTaxes,
          totalAmount: roomEditFinancials.newTotal,
        });
        billNum = confirmRes?.billNumber || "";
      } else if (roomEditFinancials.diff < 0) {
        const refundAmount = Math.abs(roomEditFinancials.diff);
        try {
          const paymentRecord = await api.getPaymentByBookingCode(roomEditBooking.booking_code);
          if (paymentRecord?.id) {
            await api.refundPayment(paymentRecord.id, refundAmount, `Admin room reduction from ${roomEditFinancials.oldCount} to ${roomEditFinancials.newCount}`);
          }
        } catch {
          // ignore payment record error
        }
      }

      await api.updateAdminBooking(roomEditBooking.id, {
        roomCount: roomEditFinancials.newCount,
      });

      setRoomEditSuccess({
        message: roomEditFinancials.diff > 0
          ? `Payment of ₹${roomEditFinancials.diff.toLocaleString("en-IN")} recorded! Room count updated to ${roomEditFinancials.newCount}.`
          : roomEditFinancials.diff < 0
            ? `Refund of ₹${Math.abs(roomEditFinancials.diff).toLocaleString("en-IN")} processed! Room count updated to ${roomEditFinancials.newCount}.`
            : `Reservation updated to ${roomEditFinancials.newCount} room(s).`,
        billNumber: billNum,
      });

      await loadData();
    } catch (err: any) {
      setRoomEditError(err.message || "Failed to update reservation rooms.");
    } finally {
      setRoomEditProcessing(false);
    }
  }

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (hotelRef.current && !hotelRef.current.contains(event.target as Node)) {
        setHotelDropdownOpen(false);
      }
      if (roomRef.current && !roomRef.current.contains(event.target as Node)) {
        setRoomDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadFailed(false);
    setNotice("");
    try {
      const [resData, hotelsData, roomsData] = await Promise.allSettled([
        api.getAdminReservations(),
        api.getAdminHotels(),
        api.getAdminRooms(),
      ]);

      if (resData.status === "rejected") {
        throw new Error(resData.reason?.message || "Failed to fetch reservations");
      }

      setBookings(resData.value?.bookings || []);

      if (hotelsData.status === "fulfilled") {
        setAvailableHotels(hotelsData.value || []);
      }
      if (roomsData.status === "fulfilled") {
        setAvailableRooms(roomsData.value || []);
      }
    } catch (err: unknown) {
      setLoadFailed(true);
      const msg = err instanceof Error ? err.message : "Error loading reservations";
      setNotice(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    let active = true;
    const syncReservations = async () => {
      try {
        const result = await api.getAdminReservations();
        if (active) setBookings(result.bookings || []);
      } catch { /* Keep the last loaded list while the booking service is unavailable. */ }
    };
    const timer = window.setInterval(() => void syncReservations(), 5000);
    window.addEventListener("focus", syncReservations);
    window.addEventListener("stayease-reservations-updated", syncReservations);
    const handleStorage = (event: StorageEvent) => { if (event.key === "stayease-reservations-updated-at") void syncReservations(); };
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", syncReservations);
      window.removeEventListener("stayease-reservations-updated", syncReservations);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function cancelReservation(row: AdminBooking) {
    if (!window.confirm(`Cancel reservation ${row.booking_code}? Its dates will be released from inventory.`)) return;
    setCancellingCode(row.booking_code);
    setNotice("");
    try {
      await api.cancelBooking(row.id);
      await loadData();
      setNotice(`Reservation ${row.booking_code} cancelled and inventory released.`);
      window.dispatchEvent(new Event("stayease-reservations-updated"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not cancel reservation.");
    } finally { setCancellingCode(""); }
  }

  // Distinct Filter Option Lists
  const distinctHotels = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.hotel_name?.trim()) set.add(b.hotel_name.trim());
    }
    return Array.from(set).sort();
  }, [bookings]);

  const distinctRoomTypes = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.room_type_name?.trim()) set.add(b.room_type_name.trim());
    }
    return Array.from(set).sort();
  }, [bookings]);

  const distinctStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.status?.trim()) set.add(b.status.trim().toUpperCase());
    }
    if (!set.has("CONFIRMED")) set.add("CONFIRMED");
    if (!set.has("PENDING PAYMENT")) set.add("PENDING PAYMENT");
    return Array.from(set).sort();
  }, [bookings]);

  // Date Preset Helpers
  function applyDatePreset(preset: "all" | "today" | "upcoming" | "7days" | "month") {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "upcoming") {
      setStartDate(todayStr);
      setEndDate("");
    } else if (preset === "7days") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  }

  // Filter Pipeline
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const guestName = `${b.guest_first_name || ""} ${b.guest_last_name || ""}`.toLowerCase();
        const match =
          b.booking_code.toLowerCase().includes(q) ||
          guestName.includes(q) ||
          (b.guest_email && b.guest_email.toLowerCase().includes(q)) ||
          (b.guest_phone && b.guest_phone.toLowerCase().includes(q)) ||
          (b.hotel_name && b.hotel_name.toLowerCase().includes(q)) ||
          (b.room_type_name && b.room_type_name.toLowerCase().includes(q)) ||
          (b.status && b.status.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Hotel Multi-Select
      if (selectedHotels.length > 0) {
        if (!b.hotel_name || !selectedHotels.includes(b.hotel_name.trim())) {
          return false;
        }
      }

      // 3. Room Type Multi-Select
      if (selectedRoomTypes.length > 0) {
        if (!b.room_type_name || !selectedRoomTypes.includes(b.room_type_name.trim())) {
          return false;
        }
      }

      // 4. Status Multi-Select
      if (selectedStatuses.length > 0) {
        const statusNormalized = (b.status || "").trim().toUpperCase();
        if (!selectedStatuses.includes(statusNormalized)) {
          return false;
        }
      }

      // 5. Date-Wise Filter
      if (startDate || endDate) {
        let targetDateStr = "";
        if (dateField === "checkin") {
          targetDateStr = b.check_in_date;
        } else if (dateField === "checkout") {
          targetDateStr = b.check_out_date;
        } else {
          targetDateStr = b.created_at;
        }

        if (targetDateStr) {
          const itemDate = new Date(targetDateStr).getTime();
          if (startDate) {
            const startLimit = new Date(`${startDate}T00:00:00`).getTime();
            if (itemDate < startLimit) return false;
          }
          if (endDate) {
            const endLimit = new Date(`${endDate}T23:59:59.999`).getTime();
            if (itemDate > endLimit) return false;
          }
        }
      }

      return true;
    });
  }, [
    bookings,
    searchQuery,
    selectedHotels,
    selectedRoomTypes,
    selectedStatuses,
    dateField,
    startDate,
    endDate,
  ]);

  // Overall and Filtered KPI Stats
  const stats = useMemo(() => {
    let totalValue = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    for (const b of filteredBookings) {
      totalValue += b.total_price || 0;
      const st = (b.status || "").toUpperCase();
      if (st.includes("CONFIRM")) confirmedCount++;
      else if (st.includes("PENDING")) pendingCount++;
    }
    return {
      totalCount: filteredBookings.length,
      confirmedCount,
      pendingCount,
      totalValue,
    };
  }, [filteredBookings]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedHotels,
    selectedRoomTypes,
    selectedStatuses,
    startDate,
    endDate,
    dateField,
  ]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Bulk Selection Helpers
  const allSelected =
    filteredBookings.length > 0 &&
    filteredBookings.every((b) => selectedCodes.has(b.booking_code));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(filteredBookings.map((b) => b.booking_code)));
    }
  }

  function toggleSelectRow(code: string) {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // Active filters count
  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedHotels.length +
    selectedRoomTypes.length +
    selectedStatuses.length +
    (startDate || endDate ? 1 : 0);

  function clearAllFilters() {
    setSearchQuery("");
    setSelectedHotels([]);
    setSelectedRoomTypes([]);
    setSelectedStatuses([]);
    setStartDate("");
    setEndDate("");
    setDatePreset("all");
  }

  // Excel Export
  function exportExcel() {
    if (filteredBookings.length === 0) {
      setNotice("No reservations match the current filters to export.");
      return;
    }
    const headers = [
      "Booking Code",
      "Hotel",
      "Room Type",
      "Guest Name",
      "Guest Email",
      "Guest Phone",
      "Check In",
      "Check Out",
      "Guests",
      "Rooms",
      "Total Price",
      "Status",
      "Booked Date",
    ];

    const rows = filteredBookings.map((b) => [
      b.booking_code,
      b.hotel_name || "",
      b.room_type_name || "",
      `${b.guest_first_name} ${b.guest_last_name}`,
      b.guest_email || "",
      b.guest_phone || "",
      b.check_in_date,
      b.check_out_date,
      b.guests_count ?? 1,
      b.room_count ?? 1,
      b.total_price,
      b.status,
      b.created_at,
    ]);

    exportToExcel({
      filename: `reservations_export_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Reservations",
      headers,
      rows,
    });
    setNotice(`Exported ${filteredBookings.length} reservations to Excel.`);
  }

  // Handle Create Reservation Submit
  async function handleCreateReservation(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNotice("");
    try {
      const hotel = availableHotels.find((h) => h.slug === createForm.hotelId || h._id === createForm.hotelId);
      const room = availableRooms.find((r) => r._id === createForm.roomTypeId);

      if (!hotel || !room) {
        throw new Error("Please select an existing hotel and room type.");
      }

      const res = await api.holdRoom({
        hotelId: hotel.slug || hotel._id,
        hotelName: hotel.name,
        roomTypeId: room._id,
        roomTypeName: room.name,
        checkInDate: createForm.checkInDate,
        checkOutDate: createForm.checkOutDate,
        guestsCount: Number(createForm.guestsCount),
        roomCount: Number(createForm.roomCount),
        guestFirstName: createForm.guestFirstName.trim(),
        guestLastName: createForm.guestLastName.trim(),
        guestEmail: createForm.guestEmail.trim(),
        guestPhone: createForm.guestPhone.trim(),
        specialRequests: createForm.specialRequests || undefined,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to create reservation");
      }

      setNotice(`Reservation ${res.data.bookingCode} held successfully!`);
      setCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Error creating reservation");
    } finally {
      setCreating(false);
    }
  }

  // Filtered rooms for create dialog
  const dialogFilteredRooms = useMemo(() => {
    if (!createForm.hotelId) return [];
    return availableRooms.filter(
      (r) => r.hotelId === createForm.hotelId || r.hotelId === availableHotels.find((h) => h._id === createForm.hotelId)?.slug
    );
  }, [createForm.hotelId, availableRooms, availableHotels]);

  return (
    <div className="admin-page">
      {/* Top Header */}
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>WORKSPACE / RESERVATIONS</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#61DAFB", fontWeight: 600 }}>
              <ReactLogo size={12} /> React 19
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--admin-ink)", fontWeight: 600 }}>
              <NextjsLogo size={11} /> Next.js
            </span>
          </div>
          <h1>Reservations</h1>
          <p>
            Real-time reservation management, inventory room holds, and sequential guest billing.
          </p>
        </div>
        <div className="admin-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={exportExcel}
            title="Export filtered records to Excel"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <DownloadIcon size={13} /> <span>Export to Excel</span>
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => window.print()}
            title="Print reservation roster"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PrinterIcon size={13} /> <span>Print</span>
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => void loadData()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshIcon size={13} /> <span>Refresh</span>
          </button>
          {modPerm.create && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => setCreateOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <PlusIcon size={13} /> <span>New reservation</span>
            </button>
          )}
          {notice && <span className="admin-action-notice" role="status">{notice}</span>}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Bookings</span>
            <span className="admin-stat-icon tone-0">
              <CalendarIcon size={14} />
            </span>
          </div>
          <strong>{stats.totalCount}</strong>
          <small>{bookings.length} recorded in reservation database</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Confirmed</span>
            <span className="admin-stat-icon tone-1">
              <CheckIcon size={14} />
            </span>
          </div>
          <strong>{stats.confirmedCount}</strong>
          <small>Fully paid &amp; guaranteed reservations</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Pending Payment</span>
            <span className="admin-stat-icon tone-2">
              <CreditCardIcon size={14} />
            </span>
          </div>
          <strong>{stats.pendingCount}</strong>
          <small>Awaiting settlement or front desk payment</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Portfolio Value</span>
            <span className="admin-stat-icon tone-3">₹</span>
          </div>
          <strong>₹{stats.totalValue.toLocaleString("en-IN")}</strong>
          <small>Combined tariff value across properties</small>
        </div>
      </div>

      {/* Main Table Panel */}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>All Reservations</h2>
            <p>
              Showing {filteredBookings.length === 0 ? "0" : `${(currentPage - 1) * pageSize + 1}–${Math.min(filteredBookings.length, currentPage * pageSize)}`} of {filteredBookings.length} database records{filteredBookings.length !== bookings.length ? ` (filtered from ${bookings.length} total)` : ""}
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-forest hover:underline"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Clear all filters ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Enhanced Multi-Select Filter Toolbar */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--admin-line)",
            backgroundColor: "#fcfdfe",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Search Box */}
          <div className="admin-table-search" style={{ minWidth: "220px", flex: "1 1 200px" }}>
            <span>⌕</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, guest, hotel, room..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#9aa59f", fontSize: "10px" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* 1. Hotel Multi-Select Filter */}
          <div style={{ position: "relative" }} ref={hotelRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedHotels.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setHotelDropdownOpen(!hotelDropdownOpen);
                setRoomDropdownOpen(false);
                setStatusDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <BuildingIcon size={12} />
              <span>Hotel {selectedHotels.length > 0 ? `(${selectedHotels.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {hotelDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "250px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--admin-ink)" }}>Select Hotels</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      style={{ fontSize: "10px", background: "none", border: "none", color: "var(--admin-forest)", cursor: "pointer" }}
                      onClick={() => setSelectedHotels([...distinctHotels])}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: "10px", background: "none", border: "none", color: "#8a968f", cursor: "pointer" }}
                      onClick={() => setSelectedHotels([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {distinctHotels.length === 0 ? (
                  <p style={{ fontSize: "11px", color: "#8a968f", padding: "6px 0" }}>No hotels found</p>
                ) : (
                  distinctHotels.map((hotel) => {
                    const checked = selectedHotels.includes(hotel);
                    return (
                      <label
                        key={hotel}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "11px",
                          padding: "5px 4px",
                          cursor: "pointer",
                          borderRadius: "4px",
                          userSelect: "none",
                        }}
                        className="hover:bg-mist"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedHotels([...selectedHotels, hotel]);
                            else setSelectedHotels(selectedHotels.filter((h) => h !== hotel));
                          }}
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hotel}</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 2. Room Type Multi-Select Filter */}
          <div style={{ position: "relative" }} ref={roomRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedRoomTypes.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setRoomDropdownOpen(!roomDropdownOpen);
                setHotelDropdownOpen(false);
                setStatusDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <BedIcon size={12} />
              <span>Room Type {selectedRoomTypes.length > 0 ? `(${selectedRoomTypes.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {roomDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "250px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--admin-ink)" }}>Select Room Types</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      style={{ fontSize: "10px", background: "none", border: "none", color: "var(--admin-forest)", cursor: "pointer" }}
                      onClick={() => setSelectedRoomTypes([...distinctRoomTypes])}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: "10px", background: "none", border: "none", color: "#8a968f", cursor: "pointer" }}
                      onClick={() => setSelectedRoomTypes([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {distinctRoomTypes.length === 0 ? (
                  <p style={{ fontSize: "11px", color: "#8a968f", padding: "6px 0" }}>No room types found</p>
                ) : (
                  distinctRoomTypes.map((room) => {
                    const checked = selectedRoomTypes.includes(room);
                    return (
                      <label
                        key={room}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "11px",
                          padding: "5px 4px",
                          cursor: "pointer",
                          borderRadius: "4px",
                          userSelect: "none",
                        }}
                        className="hover:bg-mist"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRoomTypes([...selectedRoomTypes, room]);
                            else setSelectedRoomTypes(selectedRoomTypes.filter((r) => r !== room));
                          }}
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room}</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 3. Status Multi-Select Filter */}
          <div style={{ position: "relative" }} ref={statusRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedStatuses.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setHotelDropdownOpen(false);
                setRoomDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <FilterIcon size={12} />
              <span>Status {selectedStatuses.length > 0 ? `(${selectedStatuses.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {statusDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "210px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--admin-ink)" }}>Filter Status</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      style={{ fontSize: "10px", background: "none", border: "none", color: "var(--admin-forest)", cursor: "pointer" }}
                      onClick={() => setSelectedStatuses([...distinctStatuses])}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: "10px", background: "none", border: "none", color: "#8a968f", cursor: "pointer" }}
                      onClick={() => setSelectedStatuses([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {distinctStatuses.map((st) => {
                  const checked = selectedStatuses.includes(st);
                  const isConf = st.includes("CONFIRM");
                  const isPend = st.includes("PENDING");
                  return (
                    <label
                      key={st}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "11px",
                        padding: "5px 4px",
                        cursor: "pointer",
                        borderRadius: "4px",
                      }}
                      className="hover:bg-mist"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStatuses([...selectedStatuses, st]);
                          else setSelectedStatuses(selectedStatuses.filter((s) => s !== st));
                        }}
                      />
                      <span
                        className={`admin-status ${isConf ? "status-green" : isPend ? "status-amber" : "status-gray"}`}
                        style={{ fontSize: "9px", padding: "2px 6px" }}
                      >
                        <i />
                        {st}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Date Wise Filter (Date Basis + Presets + Custom Range) */}
          <div style={{ position: "relative" }} ref={dateRef}>
            <button
              type="button"
              className={`admin-secondary-button ${startDate || endDate ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setHotelDropdownOpen(false);
                setRoomDropdownOpen(false);
                setStatusDropdownOpen(false);
              }}
            >
              <CalendarIcon size={12} />
              <span>
                {startDate || endDate
                  ? `${dateField === "checkin" ? "Check-in" : dateField === "checkout" ? "Check-out" : "Booked"}: ${startDate || "Any"} → ${endDate || "Now"}`
                  : "Date Filter"}
              </span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {dateDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  right: 0,
                  zIndex: 50,
                  width: "310px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "12px",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--admin-ink)", display: "block", marginBottom: "6px" }}>
                    Filter Date By:
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[
                      { key: "booking", label: "Booking Date" },
                      { key: "checkin", label: "Check-in Date" },
                      { key: "checkout", label: "Check-out Date" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setDateField(item.key as typeof dateField)}
                        style={{
                          flex: 1,
                          fontSize: "10px",
                          padding: "4px 2px",
                          borderRadius: "4px",
                          border: dateField === item.key ? "1px solid var(--admin-forest)" : "1px solid #d5ddd8",
                          backgroundColor: dateField === item.key ? "var(--admin-mist)" : "#fff",
                          color: dateField === item.key ? "var(--admin-forest)" : "var(--admin-ink)",
                          fontWeight: dateField === item.key ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets */}
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--admin-ink)", display: "block", marginBottom: "6px" }}>
                    Quick Presets:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {[
                      { key: "all", label: "All Time" },
                      { key: "today", label: "Today" },
                      { key: "upcoming", label: "Upcoming" },
                      { key: "7days", label: "Last 7 Days" },
                      { key: "month", label: "This Month" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => applyDatePreset(p.key as Parameters<typeof applyDatePreset>[0])}
                        style={{
                          fontSize: "10px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: datePreset === p.key ? "1px solid var(--admin-forest)" : "1px solid #d5ddd8",
                          backgroundColor: datePreset === p.key ? "var(--admin-forest)" : "#fff",
                          color: datePreset === p.key ? "#fff" : "var(--admin-ink)",
                          cursor: "pointer",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Inputs */}
                <div style={{ borderTop: "1px solid #f0f3f1", paddingTop: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--admin-ink)", display: "block", marginBottom: "6px" }}>
                    Custom Date Range:
                  </span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "9px", color: "#8a968f", display: "block", marginBottom: "2px" }}>FROM</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDatePreset("custom");
                        }}
                        style={{ width: "100%", fontSize: "11px", padding: "4px 6px", border: "1px solid #d5ddd8", borderRadius: "4px" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "9px", color: "#8a968f", display: "block", marginBottom: "2px" }}>TO</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDatePreset("custom");
                        }}
                        style={{ width: "100%", fontSize: "11px", padding: "4px 6px", border: "1px solid #d5ddd8", borderRadius: "4px" }}
                      />
                    </div>
                  </div>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => applyDatePreset("all")}
                      style={{
                        marginTop: "8px",
                        width: "100%",
                        fontSize: "10px",
                        padding: "4px",
                        background: "none",
                        border: "1px dashed #d5ddd8",
                        borderRadius: "4px",
                        color: "#8a968f",
                        cursor: "pointer",
                      }}
                    >
                      Clear Date Range
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips Ribbon */}
        {activeFiltersCount > 0 && (
          <div
            style={{
              padding: "8px 14px",
              backgroundColor: "#f5f8f6",
              borderBottom: "1px solid var(--admin-line)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
            }}
          >
            <span style={{ color: "#77857e", fontSize: "10px", fontWeight: 600 }}>Active Filters:</span>

            {searchQuery && (
              <span className="admin-chip">
                Search: “{searchQuery}”
                <button type="button" onClick={() => setSearchQuery("")} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: "4px" }}>
                  ✕
                </button>
              </span>
            )}

            {selectedHotels.map((h) => (
              <span key={h} className="admin-chip">
                Hotel: {h}
                <button
                  type="button"
                  onClick={() => setSelectedHotels(selectedHotels.filter((item) => item !== h))}
                  style={{ border: "none", background: "none", cursor: "pointer", marginLeft: "4px" }}
                >
                  ✕
                </button>
              </span>
            ))}

            {selectedRoomTypes.map((r) => (
              <span key={r} className="admin-chip">
                Room: {r}
                <button
                  type="button"
                  onClick={() => setSelectedRoomTypes(selectedRoomTypes.filter((item) => item !== r))}
                  style={{ border: "none", background: "none", cursor: "pointer", marginLeft: "4px" }}
                >
                  ✕
                </button>
              </span>
            ))}

            {selectedStatuses.map((s) => (
              <span key={s} className="admin-chip">
                Status: {s}
                <button
                  type="button"
                  onClick={() => setSelectedStatuses(selectedStatuses.filter((item) => item !== s))}
                  style={{ border: "none", background: "none", cursor: "pointer", marginLeft: "4px" }}
                >
                  ✕
                </button>
              </span>
            ))}

            {(startDate || endDate) && (
              <span className="admin-chip">
                {dateField === "checkin" ? "Check-in" : dateField === "checkout" ? "Check-out" : "Booked"}: {startDate || "Any"} → {endDate || "Now"}
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setDatePreset("all");
                  }}
                  style={{ border: "none", background: "none", cursor: "pointer", marginLeft: "4px" }}
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                marginLeft: "auto",
                border: "none",
                background: "none",
                color: "var(--admin-forest)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset All
            </button>
          </div>
        )}

        {/* Reservations Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "40px", paddingLeft: "16px" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    title="Select all"
                  />
                </th>
                <th>Booking Code</th>
                <th>Guest</th>
                <th>Hotel &amp; Room</th>
                <th>Dates</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Booked On</th>
                <th style={{ textAlign: "right", paddingRight: "16px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#8a968f" }}>
                    Loading reservations...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#8a968f" }}>
                    {loadFailed ? (
                      <div>
                        <p style={{ color: "#b91c1c", fontWeight: 500 }}>Could not load reservations. {notice || "Check service connection."}</p>
                        <p style={{ marginTop: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            type="button"
                            onClick={() => void loadData()}
                            className="admin-primary-button"
                            style={{ fontSize: "12px", padding: "6px 14px" }}
                          >
                            Retry loading
                          </button>
                        </p>
                      </div>
                    ) : (
                      <p>No reservations match the current filter selection.</p>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((row) => {
                  const isConfirmed = row.status?.toUpperCase().includes("CONFIRM");
                  const isPending = row.status?.toUpperCase().includes("PENDING");
                  const isCancelled = row.status?.toUpperCase().includes("CANCEL");

                  const checkInFormatted = row.check_in_date
                    ? new Date(row.check_in_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    : "—";

                  const checkOutFormatted = row.check_out_date
                    ? new Date(row.check_out_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    : "—";

                  return (
                    <tr key={row.booking_code || row.id}>
                      <td style={{ paddingLeft: "16px" }}>
                        <input
                          type="checkbox"
                          checked={selectedCodes.has(row.booking_code)}
                          onChange={() => toggleSelectRow(row.booking_code)}
                        />
                      </td>

                      {/* Booking Code */}
                      <td>
                        <strong
                          style={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            color: "var(--admin-forest)",
                            backgroundColor: "#f0f5f2",
                            padding: "3px 7px",
                            borderRadius: "4px",
                            border: "1px solid #d2e0d8",
                            display: "inline-block",
                          }}
                        >
                          {row.booking_code}
                        </strong>
                      </td>

                      {/* Guest */}
                      <td>
                        <div>
                          <strong style={{ color: "var(--admin-ink)", display: "block" }}>
                            {row.guest_first_name} {row.guest_last_name}
                          </strong>
                          <small style={{ color: "#77857e", fontSize: "10px" }}>
                            {row.guest_email || row.guest_phone || "—"}
                          </small>
                        </div>
                      </td>

                      {/* Hotel & Room */}
                      <td>
                        <div>
                          <strong style={{ color: "var(--admin-ink)", display: "block" }}>
                            {row.hotel_name}
                          </strong>
                          <small style={{ color: "#77857e", fontSize: "10px" }}>
                            {row.room_type_name}
                          </small>
                        </div>
                      </td>

                      {/* Stay Dates */}
                      <td>
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--admin-ink)", display: "block" }}>
                            {checkInFormatted} → {checkOutFormatted}
                          </span>
                          <small style={{ color: "#77857e", fontSize: "10px" }}>
                            {row.room_count || 1} room{(row.room_count || 1) > 1 ? "s" : ""} · {row.guests_count || 1} guest{(row.guests_count || 1) > 1 ? "s" : ""}
                          </small>
                        </div>
                      </td>

                      {/* Total Value */}
                      <td>
                        <strong style={{ color: "var(--admin-ink)", fontSize: "12px", fontWeight: 700 }}>
                          ₹{row.total_price?.toLocaleString("en-IN")}
                        </strong>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`admin-status ${isConfirmed ? "status-green" : isPending ? "status-amber" : isCancelled ? "status-rose" : "status-gray"
                            }`}
                          style={{ fontSize: "9px", padding: "3px 7px", fontWeight: 600 }}
                        >
                          <i />
                          {row.status?.replaceAll("_", " ")}
                        </span>
                      </td>

                      {/* Booked Date */}
                      <td style={{ color: "#77857e", fontSize: "10px" }}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : "—"}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: "right", paddingRight: "16px" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          {isPending ? (
                            <Link
                              href={`/booking/payment?code=${encodeURIComponent(row.booking_code)}`}
                              className="admin-primary-button"
                              style={{
                                fontSize: "10px",
                                padding: "4px 10px",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <CreditCardIcon size={11} />
                              <span>Pay</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/booking/bill?code=${encodeURIComponent(row.booking_code)}`}
                              className="admin-secondary-button"
                              style={{
                                fontSize: "10px",
                                padding: "4px 8px",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <ReceiptIcon size={11} />
                              <span>Bill</span>
                            </Link>
                          )}
                          {(isConfirmed || row.status?.toUpperCase().includes("CHECKED_IN")) && (
                            <button
                              type="button"
                              onClick={() => {
                                setRoomEditBooking(row);
                                setRoomEditNewCount(row.room_count || 1);
                                setRoomEditSuccess(null);
                                setRoomEditError("");
                                setRoomEditOpen(true);
                              }}
                              className="admin-secondary-button"
                              style={{
                                fontSize: "10px",
                                padding: "4px 8px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Edit Rooms
                            </button>
                          )}
                          {!isCancelled && (isConfirmed || isPending) && <button type="button" disabled={cancellingCode === row.booking_code} onClick={() => void cancelReservation(row)} className="admin-secondary-button" style={{ fontSize: "10px", padding: "4px 8px", color: "#b91c1c", whiteSpace: "nowrap" }}>{cancellingCode === row.booking_code ? "Cancelling…" : "Cancel"}</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="reservations"
          selectedCount={selectedCodes.size}
        />
      </section>

      {/* New Reservation Modal Dialog */}
      {createOpen && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false);
          }}
        >
          <form className="admin-dialog" onSubmit={handleCreateReservation}>
            <div className="admin-dialog-heading">
              <div>
                <span className="admin-eyebrow">NEW RECORD</span>
                <h2>New reservation</h2>
              </div>
              <button
                type="button"
                className="admin-row-menu"
                aria-label="Close dialog"
                onClick={() => setCreateOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-dialog-fields">
              {/* Hotel */}
              <label>
                Hotel
                <select
                  required
                  value={createForm.hotelId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      hotelId: e.target.value,
                      roomTypeId: "",
                    }))
                  }
                >
                  <option value="">Select a hotel...</option>
                  {availableHotels.map((h) => (
                    <option key={h._id || h.slug} value={h.slug || h._id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Room Type */}
              <label>
                Room type
                <select
                  required
                  disabled={!createForm.hotelId}
                  value={createForm.roomTypeId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      roomTypeId: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {createForm.hotelId
                      ? dialogFilteredRooms.length > 0
                        ? "Select room type..."
                        : "No rooms for this hotel"
                      : "First select a hotel..."}
                  </option>
                  {dialogFilteredRooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} · ₹{r.price.toLocaleString("en-IN")}/night ({r.capacity} guests)
                    </option>
                  ))}
                </select>
              </label>

              {/* Check-in Date */}
              <label>
                Check-in date
                <input
                  type="date"
                  required
                  value={createForm.checkInDate}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      checkInDate: e.target.value,
                    }))
                  }
                />
              </label>

              {/* Check-out Date */}
              <label>
                Check-out date
                <input
                  type="date"
                  required
                  value={createForm.checkOutDate}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      checkOutDate: e.target.value,
                    }))
                  }
                />
              </label>

              {/* Guests Count */}
              <label>
                Guests
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={createForm.guestsCount}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      guestsCount: Number(e.target.value),
                    }))
                  }
                />
              </label>

              {/* Rooms Count */}
              <label>
                Rooms
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={createForm.roomCount}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      roomCount: Number(e.target.value),
                    }))
                  }
                />
              </label>

              {/* Guest First Name */}
              <label>
                Guest first name
                <input
                  type="text"
                  required
                  value={createForm.guestFirstName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      guestFirstName: e.target.value,
                    }))
                  }
                  placeholder="e.g. Malay"
                />
              </label>

              {/* Guest Last Name */}
              <label>
                Guest last name
                <input
                  type="text"
                  required
                  value={createForm.guestLastName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      guestLastName: e.target.value,
                    }))
                  }
                  placeholder="e.g. Maity"
                />
              </label>

              {/* Guest Email */}
              <label>
                Guest email
                <input
                  type="email"
                  required
                  value={createForm.guestEmail}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      guestEmail: e.target.value,
                    }))
                  }
                  placeholder="e.g. malay@example.com"
                />
              </label>

              {/* Guest Phone */}
              <label>
                Guest phone
                <input
                  type="tel"
                  required
                  value={createForm.guestPhone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      guestPhone: e.target.value,
                    }))
                  }
                  placeholder="e.g. 9876543210"
                />
              </label>

              {/* Special Requests */}
              <label style={{ gridColumn: "1 / -1" }}>
                Special requests
                <input
                  type="text"
                  value={createForm.specialRequests}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      specialRequests: e.target.value,
                    }))
                  }
                  placeholder="e.g. Quiet corner room, early check-in"
                />
              </label>
            </div>

            {createForm.roomTypeId && (
              <div className="mt-4 space-y-3">
                {(() => {
                  const room = dialogFilteredRooms.find((candidate) => candidate._id === createForm.roomTypeId);
                  if (!room) return null;
                  return (
                    <div className="grid gap-3 rounded border border-line bg-white p-3 text-[10px] sm:grid-cols-[96px_1fr]">
                      {room.image && <img src={room.image} alt={room.name} className="h-20 w-full rounded object-cover" />}
                      <div>
                        <strong className="block text-xs">{room.name}</strong>
                        <span className="mt-1 block text-muted">{room.bedType || "Room"} · up to {room.capacity} guests · {room.roomSize || "Size not specified"}</span>
                        <span className="mt-1 block text-muted">{room.description || "No additional room description."}</span>
                        <span className="mt-1 block text-forest">{room.amenities?.join(" · ") || "No amenities listed."}</span>
                      </div>
                    </div>
                  );
                })()}
                <RoomAvailabilityCalendar
                  compact
                  roomTypeId={createForm.roomTypeId}
                  roomCount={Number(createForm.roomCount) || 1}
                  checkIn={createForm.checkInDate}
                  checkOut={createForm.checkOutDate}
                  onDatesChange={(checkInDate, checkOutDate) => setCreateForm((prev) => ({ ...prev, checkInDate, checkOutDate }))}
                />
              </div>
            )}

            <div className="admin-dialog-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={creating}
              >
                {creating ? "Holding room..." : "Save record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Room Modification Dialog */}
      {roomEditOpen && roomEditBooking && roomEditFinancials && (
        <div className="admin-dialog-backdrop">
          <div className="admin-dialog" style={{ maxWidth: "560px" }}>
            <div className="admin-dialog-header">
              <div>
                <h3 className="admin-dialog-title">Modify Reservation Rooms</h3>
                <p className="admin-dialog-subtitle">Booking Code: {roomEditBooking.booking_code}</p>
              </div>
              <button
                type="button"
                className="admin-dialog-close"
                onClick={() => setRoomEditOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              {/* Booking Details Preview */}
              <div style={{ padding: "12px", background: "#f6f7f5", borderRadius: "6px", fontSize: "11px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <span style={{ color: "#8a968f", display: "block" }}>Guest</span>
                  <strong>{roomEditBooking.guest_first_name} {roomEditBooking.guest_last_name}</strong>
                </div>
                <div>
                  <span style={{ color: "#8a968f", display: "block" }}>Hotel</span>
                  <strong>{roomEditBooking.hotel_name}</strong>
                </div>
                <div>
                  <span style={{ color: "#8a968f", display: "block" }}>Room Type</span>
                  <strong>{roomEditBooking.room_type_name}</strong>
                </div>
                <div>
                  <span style={{ color: "#8a968f", display: "block" }}>Stay Duration</span>
                  <strong>{roomEditFinancials.nights} night{roomEditFinancials.nights > 1 ? "s" : ""}</strong>
                </div>
              </div>

              {/* Room Count Stepper */}
              <div style={{ padding: "16px", border: "1px solid #e2e8e4", borderRadius: "6px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1a2e26", marginBottom: "8px" }}>
                  Adjust Number of Rooms
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setRoomEditNewCount((prev) => Math.max(1, prev - 1))}
                    disabled={roomEditNewCount <= 1 || roomEditProcessing}
                    className="admin-secondary-button"
                    style={{ fontSize: "16px", width: "36px", height: "36px", padding: 0 }}
                  >
                    –
                  </button>
                  <span style={{ fontSize: "16px", fontWeight: 700, minWidth: "40px", textAlign: "center" }}>
                    {roomEditNewCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRoomEditNewCount((prev) => Math.min(20, prev + 1))}
                    disabled={roomEditNewCount >= 20 || roomEditProcessing}
                    className="admin-secondary-button"
                    style={{ fontSize: "16px", width: "36px", height: "36px", padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: "11px", color: "#8a968f", marginLeft: "8px" }}>
                    (Currently: {roomEditFinancials.oldCount} room{roomEditFinancials.oldCount > 1 ? "s" : ""})
                  </span>
                </div>
              </div>

              {/* Financial Calculation Notice */}
              {roomEditFinancials.diff > 0 && (
                <div style={{ padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#166534" }}>
                        Additional Room Charge (+{roomEditFinancials.newCount - roomEditFinancials.oldCount} room{roomEditFinancials.newCount - roomEditFinancials.oldCount > 1 ? "s" : ""})
                      </p>
                      <p style={{ fontSize: "10px", color: "#4b5563" }}>
                        Revised Total: ₹{roomEditFinancials.newTotal.toLocaleString("en-IN")} · Previous: ₹{roomEditFinancials.oldTotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "10px", color: "#4b5563" }}>Balance Due:</span>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#166534" }}>
                        ₹{roomEditFinancials.diff.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: "10px", color: "#15803d", marginTop: "6px" }}>
                    Before saving the updated room count, payment of the remaining amount must be recorded. A new bill will be generated automatically.
                  </p>

                  {/* Payment Method Selector */}
                  <div style={{ marginTop: "12px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                      Payment Collection Method
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {(["Instant UPI QR", "Credit / Debit card", "Cash at Front Desk", "Bank Transfer"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setRoomEditPaymentMethod(method)}
                          style={{
                            padding: "6px 8px",
                            fontSize: "10px",
                            borderRadius: "4px",
                            border: roomEditPaymentMethod === method ? "1.5px solid #166534" : "1px solid #d1d5db",
                            background: roomEditPaymentMethod === method ? "#dcfce7" : "#ffffff",
                            fontWeight: roomEditPaymentMethod === method ? 600 : 400,
                            color: roomEditPaymentMethod === method ? "#166534" : "#374151",
                            cursor: "pointer",
                          }}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    {roomEditPaymentMethod === "Instant UPI QR" && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", marginTop: "8px" }}>
                        <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: "6px" }}>Scan to Collect via UPI (GPay / PhonePe / Paytm)</p>
                        <QRCodeSVG
                          value={`upi://pay?pa=stayease@okhdfcbank&pn=StayEase+Hotels&am=${roomEditFinancials.diff}&cu=INR&tn=Admin+Room+Upgrade+${encodeURIComponent(roomEditBooking.booking_code)}`}
                          size={110}
                          level="M"
                        />
                        <p style={{ fontSize: "9px", fontFamily: "monospace", color: "#9ca3af", marginTop: "4px" }}>stayease@okhdfcbank</p>
                        <div style={{ width: "100%", marginTop: "10px" }}>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                            UPI UTR / Reference Number (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Enter 12-digit UPI UTR (e.g. 438291028371)"
                            value={upiDetails.upiRefNumber}
                            onChange={(e) => setUpiDetails({ upiRefNumber: e.target.value.trim() })}
                            style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "monospace" }}
                          />
                        </div>
                      </div>
                    )}

                    {roomEditPaymentMethod === "Credit / Debit card" && (
                      <div style={{ padding: "12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#1f2937" }}>Card Transaction Details</p>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                            Card Number (16 digits)
                          </label>
                          <input
                            type="text"
                            placeholder="4532 0000 0000 8892"
                            maxLength={19}
                            value={cardDetails.cardNumber}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                              const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
                              setCardDetails((prev) => ({ ...prev, cardNumber: formatted }));
                            }}
                            style={{ width: "100%", height: "32px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "12px", fontFamily: "monospace" }}
                          />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              placeholder="Name on card"
                              value={cardDetails.cardHolder}
                              onChange={(e) => setCardDetails((prev) => ({ ...prev, cardHolder: e.target.value }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              POS / Terminal Auth Code
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. AUTH-9281"
                              value={cardDetails.authCode}
                              onChange={(e) => setCardDetails((prev) => ({ ...prev, authCode: e.target.value }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "monospace" }}
                            />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              Expiry (MM/YY)
                            </label>
                            <input
                              type="text"
                              placeholder="12/28"
                              maxLength={5}
                              value={cardDetails.expiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
                                setCardDetails((prev) => ({ ...prev, expiry: val }));
                              }}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "monospace" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              CVV
                            </label>
                            <input
                              type="password"
                              placeholder="•••"
                              maxLength={4}
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "monospace" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {roomEditPaymentMethod === "Bank Transfer" && (
                      <div style={{ padding: "12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#1f2937" }}>Bank Transfer / NEFT / RTGS Details</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              Originating / Deposited Bank
                            </label>
                            <select
                              value={bankDetails.bankName}
                              onChange={(e) => setBankDetails((prev) => ({ ...prev, bankName: e.target.value }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 6px", fontSize: "11px" }}
                            >
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="State Bank of India">State Bank of India</option>
                              <option value="Axis Bank">Axis Bank</option>
                              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                              <option value="Punjab National Bank">Punjab National Bank</option>
                              <option value="Other Bank">Other Bank</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              Bank Account Number
                            </label>
                            <input
                              type="text"
                              placeholder="Enter account digits"
                              maxLength={18}
                              value={bankDetails.accountNumber}
                              onChange={(e) => setBankDetails((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "") }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "monospace" }}
                            />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              UTR / Transaction Ref Number
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. UTR202611239842"
                              value={bankDetails.utrNumber}
                              onChange={(e) => setBankDetails((prev) => ({ ...prev, utrNumber: e.target.value.trim().toUpperCase() }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "monospace" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              Transfer Date
                            </label>
                            <input
                              type="date"
                              value={bankDetails.transferDate}
                              onChange={(e) => setBankDetails((prev) => ({ ...prev, transferDate: e.target.value }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {roomEditPaymentMethod === "Cash at Front Desk" && (
                      <div style={{ padding: "12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#1f2937" }}>Front Desk Cash Collection Details</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              Cash Receipt / Voucher #
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. REC-8921"
                              value={cashDetails.receiptNumber}
                              onChange={(e) => setCashDetails((prev) => ({ ...prev, receiptNumber: e.target.value.trim().toUpperCase() }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "monospace" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#4b5563", marginBottom: "3px" }}>
                              Cashier / Staff Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Malay Maity (Front Desk)"
                              value={cashDetails.collectedBy}
                              onChange={(e) => setCashDetails((prev) => ({ ...prev, collectedBy: e.target.value }))}
                              style={{ width: "100%", height: "30px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0 8px", fontSize: "11px" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {roomEditFinancials.diff < 0 && (
                <div style={{ padding: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#92400e" }}>
                        Room Reduction Refund (-{roomEditFinancials.oldCount - roomEditFinancials.newCount} room{roomEditFinancials.oldCount - roomEditFinancials.newCount > 1 ? "s" : ""})
                      </p>
                      <p style={{ fontSize: "10px", color: "#4b5563" }}>
                        Revised Total: ₹{roomEditFinancials.newTotal.toLocaleString("en-IN")} · Previous: ₹{roomEditFinancials.oldTotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "10px", color: "#4b5563" }}>Refund Amount:</span>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#b45309" }}>
                        ₹{Math.abs(roomEditFinancials.diff).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: "10px", color: "#b45309", marginTop: "6px" }}>
                    A refund of ₹{Math.abs(roomEditFinancials.diff).toLocaleString("en-IN")} will be processed to the guest, and an updated bill will be generated.
                  </p>
                </div>
              )}

              {roomEditFinancials.diff === 0 && (
                <p style={{ fontSize: "11px", color: "#6b7280" }}>
                  Room count remains unchanged. No billing adjustment required.
                </p>
              )}

              {roomEditError && (
                <div style={{ padding: "8px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontSize: "11px" }}>
                  {roomEditError}
                </div>
              )}

              {roomEditSuccess && (
                <div style={{ padding: "10px 12px", background: "#f0fdf4", color: "#166534", borderRadius: "4px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{roomEditSuccess.message}</span>
                  <Link
                    href={`/booking/bill?code=${encodeURIComponent(roomEditBooking.booking_code)}`}
                    style={{ fontWeight: 600, color: "#166534", textDecoration: "underline", marginLeft: "8px" }}
                  >
                    View Bill ↗
                  </Link>
                </div>
              )}
            </div>

            <div className="admin-dialog-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setRoomEditOpen(false)}
                disabled={roomEditProcessing}
              >
                Close
              </button>

              {roomEditFinancials.diff > 0 ? (
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => void handleExecuteRoomModification()}
                  disabled={roomEditProcessing}
                >
                  {roomEditProcessing ? "Processing & Generating Bill…" : `Pay ₹${roomEditFinancials.diff.toLocaleString("en-IN")} & Save`}
                </button>
              ) : roomEditFinancials.diff < 0 ? (
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => void handleExecuteRoomModification()}
                  disabled={roomEditProcessing}
                  style={{ background: "#92400e" }}
                >
                  {roomEditProcessing ? "Processing Refund…" : `Process Refund of ₹${Math.abs(roomEditFinancials.diff).toLocaleString("en-IN")} & Save`}
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => void handleExecuteRoomModification()}
                  disabled={roomEditProcessing}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
