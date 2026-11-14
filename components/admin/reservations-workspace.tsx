"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  api,
  type AdminBooking,
  type AdminHotel,
  type AdminRoom,
} from "@/lib/api-client";
import { exportToExcel } from "@/lib/export-excel";
import { getEffectivePermissions } from "@/lib/rbac";
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
              Showing {filteredBookings.length} of {bookings.length} database records
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
                        <p>Could not load reservations. {notice || "Check service connection."}</p>
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
                    ) : (
                      <p>No reservations match the current filter selection.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((row) => {
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
