"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { api, type AdminPayment, type AdminBooking } from "@/lib/api-client";
import { FigmaIcon } from "@/components/figma-icon";
import {
  BuildingIcon,
  CreditCardIcon,
  CalendarIcon,
  PrinterIcon,
  ReceiptIcon,
  DownloadIcon,
  RefreshIcon,
  CheckIcon,
} from "@/components/icons";

interface EnrichedPayment {
  id: string;
  bookingId: string;
  bookingCode: string;
  billNumber: string;
  hotelName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeName: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  bookingDate: string; // ISO or date string
  paymentDate: string; // ISO
  receiptUrl?: string;
  raw: AdminPayment;
}

export function PaymentsWorkspace() {
  const [payments, setPayments] = useState<EnrichedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter States (All Multiple Selection)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateField, setDateField] = useState<"payment" | "booking">("payment");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "7days" | "month" | "custom">("all");

  // Dropdown Open States
  const [hotelDropdownOpen, setHotelDropdownOpen] = useState(false);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const hotelRef = useRef<HTMLDivElement>(null);
  const methodRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (hotelRef.current && !hotelRef.current.contains(event.target as Node)) {
        setHotelDropdownOpen(false);
      }
      if (methodRef.current && !methodRef.current.contains(event.target as Node)) {
        setMethodDropdownOpen(false);
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
      const [paymentsData, reservationsData] = await Promise.allSettled([
        api.getAdminPayments(),
        api.getAdminReservations(),
      ]);

      if (paymentsData.status === "rejected") {
        throw new Error(paymentsData.reason?.message || "Failed to fetch payments");
      }

      const bookingsList: AdminBooking[] =
        reservationsData.status === "fulfilled" && reservationsData.value?.bookings
          ? reservationsData.value.bookings
          : [];

      const bookingMap = new Map<string, AdminBooking>();
      for (const b of bookingsList) {
        if (b.id) bookingMap.set(b.id, b);
        if (b.booking_code) bookingMap.set(b.booking_code, b);
      }

      const enriched: EnrichedPayment[] = paymentsData.value.map((p) => {
        const meta = (p.metadata as any) || {};
        const b = bookingMap.get(p.bookingCode) || bookingMap.get(p.id) || null;

        const billNumber = meta.billNumber || meta.invoiceNumber || "—";
        const hotelName = meta.hotelName || b?.hotel_name || "StayEase Hotel";
        const guestName =
          meta.guestName ||
          (b ? `${b.guest_first_name} ${b.guest_last_name}`.trim() : "Valued Guest");
        const guestEmail = meta.guestEmail || b?.guest_email || "";
        const guestPhone = meta.guestPhone || b?.guest_phone || "";
        const roomTypeName = meta.roomTypeName || b?.room_type_name || "Room";
        const bookingDate = b?.created_at || p.createdAt;
        const paymentDate = p.createdAt;

        return {
          id: p.id,
          bookingId: (p as any).bookingId || b?.id || "",
          bookingCode: p.bookingCode,
          billNumber,
          hotelName,
          guestName,
          guestEmail,
          guestPhone,
          roomTypeName,
          amount: p.amount,
          currency: p.currency || "INR",
          status: p.status,
          paymentMethod: p.paymentMethod || p.provider || "Online Payment",
          bookingDate,
          paymentDate,
          receiptUrl: p.receiptUrl || undefined,
          raw: p,
        };
      });

      setPayments(enriched);
    } catch (err: any) {
      setLoadFailed(true);
      setNotice(err.message || "Could not load transactions from payment service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // Distinct Filter Choices
  const distinctHotels = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.hotelName) set.add(p.hotelName);
    });
    return Array.from(set).sort();
  }, [payments]);

  const distinctMethods = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.paymentMethod) set.add(p.paymentMethod);
    });
    return Array.from(set).sort();
  }, [payments]);

  const distinctStatuses = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.status) set.add(p.status.toUpperCase());
    });
    if (!set.has("SUCCESS")) set.add("SUCCESS");
    if (!set.has("PENDING")) set.add("PENDING");
    if (!set.has("REFUNDED")) set.add("REFUNDED");
    return Array.from(set);
  }, [payments]);

  // Apply Date Preset helper
  function applyPreset(preset: "all" | "today" | "7days" | "month" | "custom") {
    setDatePreset(preset);
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = formatYMD(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(today));
    } else if (preset === "month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatYMD(startOfMonth));
      setEndDate(formatYMD(today));
    }
  }

  // Multi-selection Filter Logic
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.bookingCode.toLowerCase().includes(q) ||
          item.billNumber.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.hotelName.toLowerCase().includes(q) ||
          item.guestName.toLowerCase().includes(q) ||
          item.guestEmail.toLowerCase().includes(q) ||
          item.paymentMethod.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Hotel Multi-select
      if (selectedHotels.length > 0 && !selectedHotels.includes(item.hotelName)) {
        return false;
      }

      // 3. Payment Method Multi-select
      if (selectedMethods.length > 0 && !selectedMethods.includes(item.paymentMethod)) {
        return false;
      }

      // 4. Status Multi-select
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.status.toUpperCase())) {
        return false;
      }

      // 5. Date-wise Filter (Payment Date or Booking Date)
      const targetDateStr = dateField === "payment" ? item.paymentDate : item.bookingDate;
      if (startDate || endDate) {
        if (!targetDateStr) return false;
        const targetDate = new Date(targetDateStr).getTime();

        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`).getTime();
          if (targetDate < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`).getTime();
          if (targetDate > end) return false;
        }
      }

      return true;
    });
  }, [payments, searchQuery, selectedHotels, selectedMethods, selectedStatuses, dateField, startDate, endDate]);

  // Summary Metrics
  const stats = useMemo(() => {
    const successPayments = payments.filter((p) => p.status.toUpperCase() === "SUCCESS");
    const totalCollected = successPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const avgTicket = successPayments.length > 0 ? Math.round(totalCollected / successPayments.length) : 0;
    const pendingCount = payments.filter((p) => p.status.toUpperCase() === "PENDING").length;

    return {
      totalCollected,
      totalCount: payments.length,
      successCount: successPayments.length,
      pendingCount,
      avgTicket,
    };
  }, [payments]);

  // Checkbox helpers
  function toggleSelectAll() {
    if (selectedIds.size === filteredPayments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPayments.map((p) => p.id)));
    }
  }

  function toggleSelectRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function clearAllFilters() {
    setSearchQuery("");
    setSelectedHotels([]);
    setSelectedMethods([]);
    setSelectedStatuses([]);
    setStartDate("");
    setEndDate("");
    setDatePreset("all");
  }

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedHotels.length +
    selectedMethods.length +
    selectedStatuses.length +
    (startDate || endDate ? 1 : 0);

  // CSV Export
  function exportCSV() {
    if (filteredPayments.length === 0) return;
    const headers = [
      "Payment ID",
      "Invoice / Bill No",
      "Booking Code",
      "Hotel",
      "Guest Name",
      "Guest Email",
      "Payment Method",
      "Amount (INR)",
      "Status",
      "Booking Date",
      "Payment Date",
    ];
    const rows = filteredPayments.map((p) => [
      `"${p.id}"`,
      `"${p.billNumber}"`,
      `"${p.bookingCode}"`,
      `"${p.hotelName}"`,
      `"${p.guestName}"`,
      `"${p.guestEmail}"`,
      `"${p.paymentMethod}"`,
      p.amount,
      `"${p.status}"`,
      `"${new Date(p.bookingDate).toLocaleString("en-IN")}"`,
      `"${new Date(p.paymentDate).toLocaleString("en-IN")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stayease-payments-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      {/* Top Page Header */}
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">WORKSPACE&nbsp; / &nbsp;PAYMENTS &amp; SETTLEMENTS</div>
          <h1>Payments &amp; Transactions</h1>
          <p>
            Real-time multi-filtered transaction audit, payment gateway settlements, and sequential tax invoices.
          </p>
        </div>
        <div className="admin-heading-actions">
          <button type="button" className="admin-secondary-button" onClick={exportCSV} title="Export filtered records to CSV" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <DownloadIcon size={13} /> <span>Export CSV</span>
          </button>
          <button type="button" className="admin-secondary-button" onClick={() => window.print()} title="Print transaction sheet" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <PrinterIcon size={13} /> <span>Print</span>
          </button>
          <button type="button" className="admin-primary-button" onClick={() => void loadData()} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <RefreshIcon size={13} /> <span>Refresh</span>
          </button>
          {notice && <span className="admin-action-notice" role="status">{notice}</span>}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Collected</span>
            <span className="admin-stat-icon tone-0">₹</span>
          </div>
          <strong>₹{stats.totalCollected.toLocaleString("en-IN")}</strong>
          <small>Net settled revenue across properties</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Transactions</span>
            <span className="admin-stat-icon tone-1">▤</span>
          </div>
          <strong>{stats.totalCount}</strong>
          <small>{filteredPayments.length} matching current filters</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Success Rate</span>
            <span className="admin-stat-icon tone-2">✓</span>
          </div>
          <strong>
            {stats.totalCount > 0 ? `${Math.round((stats.successCount / stats.totalCount) * 100)}%` : "100%"}
          </strong>
          <small>{stats.successCount} successful payment{stats.successCount === 1 ? "" : "s"}</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Average Ticket</span>
            <span className="admin-stat-icon tone-3">↗</span>
          </div>
          <strong>₹{stats.avgTicket.toLocaleString("en-IN")}</strong>
          <small>Average transaction amount</small>
        </div>
      </div>

      {/* Main Table Panel */}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>All Payment Transactions</h2>
            <p>
              Showing {filteredPayments.length} of {payments.length} database records
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
              placeholder="Search code, bill #, guest, hotel..."
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
                setMethodDropdownOpen(false);
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
                  width: "240px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px 8px", borderBottom: "1px solid #f0f2f1", fontSize: "10px", fontWeight: 600, color: "var(--admin-muted)" }}>
                  <span>Filter by Hotel</span>
                  {selectedHotels.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedHotels([])}
                      style={{ border: "none", background: "none", color: "var(--admin-green)", cursor: "pointer", fontSize: "10px" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {distinctHotels.map((hotel) => {
                    const checked = selectedHotels.includes(hotel);
                    return (
                      <label
                        key={hotel}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer",
                          backgroundColor: checked ? "var(--admin-mint)" : "transparent",
                          color: checked ? "var(--admin-green-dark)" : "var(--admin-ink)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) setSelectedHotels(selectedHotels.filter((h) => h !== hotel));
                            else setSelectedHotels([...selectedHotels, hotel]);
                          }}
                          className="accent-[#176b58]"
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {hotel}
                        </span>
                      </label>
                    );
                  })}
                  {distinctHotels.length === 0 && (
                    <p style={{ padding: "8px", fontSize: "11px", color: "#9aa49f", textAlign: "center" }}>
                      No hotels found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Payment Method Multi-Select Filter */}
          <div style={{ position: "relative" }} ref={methodRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedMethods.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setMethodDropdownOpen(!methodDropdownOpen);
                setHotelDropdownOpen(false);
                setStatusDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <CreditCardIcon size={12} />
              <span>Method {selectedMethods.length > 0 ? `(${selectedMethods.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {methodDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "220px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px 8px", borderBottom: "1px solid #f0f2f1", fontSize: "10px", fontWeight: 600, color: "var(--admin-muted)" }}>
                  <span>Filter by Method</span>
                  {selectedMethods.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethods([])}
                      style={{ border: "none", background: "none", color: "var(--admin-green)", cursor: "pointer", fontSize: "10px" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {distinctMethods.map((method) => {
                    const checked = selectedMethods.includes(method);
                    return (
                      <label
                        key={method}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer",
                          backgroundColor: checked ? "var(--admin-mint)" : "transparent",
                          color: checked ? "var(--admin-green-dark)" : "var(--admin-ink)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) setSelectedMethods(selectedMethods.filter((m) => m !== method));
                            else setSelectedMethods([...selectedMethods, method]);
                          }}
                          className="accent-[#176b58]"
                        />
                        <span>{method}</span>
                      </label>
                    );
                  })}
                </div>
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
                setMethodDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <span>● Status {selectedStatuses.length > 0 ? `(${selectedStatuses.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {statusDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "190px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px 8px", borderBottom: "1px solid #f0f2f1", fontSize: "10px", fontWeight: 600, color: "var(--admin-muted)" }}>
                  <span>Filter by Status</span>
                  {selectedStatuses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStatuses([])}
                      style={{ border: "none", background: "none", color: "var(--admin-green)", cursor: "pointer", fontSize: "10px" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {distinctStatuses.map((st) => {
                    const checked = selectedStatuses.includes(st);
                    return (
                      <label
                        key={st}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer",
                          backgroundColor: checked ? "var(--admin-mint)" : "transparent",
                          color: checked ? "var(--admin-green-dark)" : "var(--admin-ink)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) setSelectedStatuses(selectedStatuses.filter((s) => s !== st));
                            else setSelectedStatuses([...selectedStatuses, st]);
                          }}
                          className="accent-[#176b58]"
                        />
                        <span style={{ fontWeight: 500 }}>{st}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Date Wise Filter (Date basis + Range + Presets) */}
          <div style={{ position: "relative" }} ref={dateRef}>
            <button
              type="button"
              className={`admin-secondary-button ${startDate || endDate ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setHotelDropdownOpen(false);
                setMethodDropdownOpen(false);
                setStatusDropdownOpen(false);
              }}
            >
              <CalendarIcon size={12} />
              <span>
                {startDate || endDate ? `${dateField === "payment" ? "Paid" : "Booked"}: ${startDate || "Any"} → ${endDate || "Now"}` : "Date Filter"}
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
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #f0f2f1", fontSize: "11px", fontWeight: 600 }}>
                  <span>Filter Date By</span>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => applyPreset("all")}
                      style={{ border: "none", background: "none", color: "var(--admin-green)", cursor: "pointer", fontSize: "10px" }}
                    >
                      Reset Date
                    </button>
                  )}
                </div>

                {/* Date Basis: Payment Date vs Booking Date */}
                <div style={{ marginTop: "10px", display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setDateField("payment")}
                    style={{
                      flex: 1,
                      padding: "5px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      border: "1px solid var(--admin-line)",
                      backgroundColor: dateField === "payment" ? "var(--admin-green)" : "#fff",
                      color: dateField === "payment" ? "#fff" : "var(--admin-ink)",
                      cursor: "pointer",
                      fontWeight: dateField === "payment" ? 600 : 400,
                    }}
                  >
                    Payment Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateField("booking")}
                    style={{
                      flex: 1,
                      padding: "5px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      border: "1px solid var(--admin-line)",
                      backgroundColor: dateField === "booking" ? "var(--admin-green)" : "#fff",
                      color: dateField === "booking" ? "#fff" : "var(--admin-ink)",
                      cursor: "pointer",
                      fontWeight: dateField === "booking" ? 600 : 400,
                    }}
                  >
                    Booking Date
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {[
                    { id: "all", label: "All Time" },
                    { id: "today", label: "Today" },
                    { id: "7days", label: "Last 7 Days" },
                    { id: "month", label: "This Month" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id as any)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "9px",
                        border: "1px solid var(--admin-line)",
                        backgroundColor: datePreset === p.id ? "var(--admin-mint)" : "#fff",
                        color: datePreset === p.id ? "var(--admin-green-dark)" : "var(--admin-muted)",
                        fontWeight: datePreset === p.id ? 600 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Inputs */}
                <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <label style={{ fontSize: "9px", color: "var(--admin-muted)" }}>
                    From Date
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset("custom");
                      }}
                      style={{
                        marginTop: "2px",
                        width: "100%",
                        padding: "4px 6px",
                        borderRadius: "4px",
                        border: "1px solid var(--admin-line)",
                        fontSize: "11px",
                      }}
                    />
                  </label>
                  <label style={{ fontSize: "9px", color: "var(--admin-muted)" }}>
                    To Date
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset("custom");
                      }}
                      style={{
                        marginTop: "2px",
                        width: "100%",
                        padding: "4px 6px",
                        borderRadius: "4px",
                        border: "1px solid var(--admin-line)",
                        fontSize: "11px",
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips Ribbon */}
        {activeFiltersCount > 0 && (
          <div
            style={{
              padding: "6px 14px",
              backgroundColor: "#f5f9f6",
              borderBottom: "1px solid var(--admin-line)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px",
              fontSize: "10px",
            }}
          >
            <span style={{ color: "var(--admin-muted)", fontWeight: 600 }}>Active Filters:</span>
            {selectedHotels.map((h) => (
              <span
                key={h}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  padding: "2px 8px",
                  color: "var(--admin-green-dark)",
                }}
              >
                Hotel: {h}
                <button
                  type="button"
                  onClick={() => setSelectedHotels(selectedHotels.filter((x) => x !== h))}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#8a9690", fontSize: "10px" }}
                >
                  ✕
                </button>
              </span>
            ))}
            {selectedMethods.map((m) => (
              <span
                key={m}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  padding: "2px 8px",
                  color: "var(--admin-green-dark)",
                }}
              >
                Method: {m}
                <button
                  type="button"
                  onClick={() => setSelectedMethods(selectedMethods.filter((x) => x !== m))}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#8a9690", fontSize: "10px" }}
                >
                  ✕
                </button>
              </span>
            ))}
            {selectedStatuses.map((s) => (
              <span
                key={s}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  padding: "2px 8px",
                  color: "var(--admin-green-dark)",
                }}
              >
                Status: {s}
                <button
                  type="button"
                  onClick={() => setSelectedStatuses(selectedStatuses.filter((x) => x !== s))}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#8a9690", fontSize: "10px" }}
                >
                  ✕
                </button>
              </span>
            ))}
            {(startDate || endDate) && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  padding: "2px 8px",
                  color: "var(--admin-green-dark)",
                }}
              >
                {dateField === "payment" ? "Paid" : "Booked"}: {startDate || "Start"} → {endDate || "Now"}
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#8a9690", fontSize: "10px" }}
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
                color: "#bd6459",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "10px",
              }}
            >
              Reset all
            </button>
          </div>
        )}

        {/* Scrollable Data Table with Full Columns */}
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "32px", paddingLeft: "14px" }}>
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={filteredPayments.length > 0 && selectedIds.size === filteredPayments.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>PAYMENT ID</th>
                <th>INVOICE / BILL NO</th>
                <th>BOOKING CODE</th>
                <th>HOTEL</th>
                <th>GUEST</th>
                <th>PAYMENT METHOD</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>BOOKING DATE</th>
                <th>PAYMENT DATE</th>
                <th style={{ textAlign: "right", paddingRight: "16px" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "36px", color: "var(--admin-muted)" }}>
                    Loading payment transactions and bills…
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--admin-muted)", fontSize: "12px" }}>
                      {loadFailed ? (
                        <div>
                          <p>Could not load payments: {notice || "Service connection failed."}</p>
                          <button
                            type="button"
                            onClick={() => void loadData()}
                            className="admin-primary-button"
                            style={{ marginTop: "10px" }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : activeFiltersCount > 0 ? (
                        <div>
                          <p>No transactions match your active filter criteria.</p>
                          <button
                            type="button"
                            onClick={clearAllFilters}
                            className="admin-secondary-button"
                            style={{ marginTop: "8px", fontSize: "11px" }}
                          >
                            Clear Filters
                          </button>
                        </div>
                      ) : (
                        "No payment transactions recorded yet."
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((row) => {
                  const isChecked = selectedIds.has(row.id);
                  const isSuccess = row.status.toUpperCase() === "SUCCESS";
                  const isPending = row.status.toUpperCase() === "PENDING";
                  const isRefunded = row.status.toUpperCase() === "REFUNDED";

                  return (
                    <tr key={row.id} style={{ backgroundColor: isChecked ? "#f4f9f6" : undefined }}>
                      <td style={{ paddingLeft: "14px" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(row.id)}
                          aria-label={`Select ${row.bookingCode}`}
                        />
                      </td>

                      {/* Payment ID (short monospace) */}
                      <td className="admin-id" title={row.id} style={{ fontFamily: "monospace", fontSize: "10px" }}>
                        {row.id.slice(0, 8)}…
                      </td>

                      {/* Bill / Invoice Number */}
                      <td>
                        {row.billNumber && row.billNumber !== "—" ? (
                          <Link
                            href={`/booking/bill?code=${encodeURIComponent(row.bookingCode)}&invoice=${encodeURIComponent(row.billNumber)}`}
                            style={{
                              display: "inline-block",
                              borderRadius: "4px",
                              backgroundColor: "#e8f4ef",
                              color: "#176b58",
                              padding: "2px 6px",
                              fontFamily: "monospace",
                              fontWeight: 600,
                              fontSize: "10px",
                              textDecoration: "none",
                              border: "1px solid #c9e4d7",
                            }}
                            title="Click to view official printable tax bill"
                          >
                            {row.billNumber}
                          </Link>
                        ) : (
                          <span style={{ color: "#9aa49f", fontSize: "10px" }}>—</span>
                        )}
                      </td>

                      {/* Booking Code */}
                      <td>
                        <strong style={{ fontFamily: "monospace", color: "var(--admin-ink)", fontSize: "11px" }}>
                          {row.bookingCode}
                        </strong>
                      </td>

                      {/* Hotel */}
                      <td>
                        <div>
                          <strong style={{ fontSize: "11px", color: "#34443e", display: "block" }}>
                            {row.hotelName}
                          </strong>
                          <small style={{ color: "#8a9690", fontSize: "9px" }}>{row.roomTypeName}</small>
                        </div>
                      </td>

                      {/* Guest */}
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: "#34443e", display: "block", fontSize: "11px" }}>
                            {row.guestName}
                          </span>
                          <small style={{ color: "#8a9690", fontSize: "9px" }}>
                            {row.guestEmail || row.guestPhone || "—"}
                          </small>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 500,
                            backgroundColor: "#f4f6f5",
                            color: "#465950",
                            border: "1px solid #e2e8e5",
                          }}
                        >
                          <CreditCardIcon size={12} className="text-forest" />
                          {row.paymentMethod}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <strong style={{ color: "var(--admin-ink)", fontSize: "12px", fontWeight: 700 }}>
                          ₹{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`admin-status ${isSuccess ? "status-green" : isPending ? "status-amber" : isRefunded ? "status-rose" : "status-gray"
                            }`}
                          style={{ fontSize: "9px", padding: "3px 7px", fontWeight: 600 }}
                        >
                          <i />
                          {row.status}
                        </span>
                      </td>

                      {/* Booking Date */}
                      <td style={{ color: "#77857e", fontSize: "10px" }}>
                        {row.bookingDate
                          ? new Date(row.bookingDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : "—"}
                      </td>

                      {/* Payment Date */}
                      <td style={{ color: "#77857e", fontSize: "10px" }}>
                        {row.paymentDate
                          ? new Date(row.paymentDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "—"}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: "right", paddingRight: "16px" }}>
                        <Link
                          href={`/booking/bill?code=${encodeURIComponent(row.bookingCode)}${row.billNumber && row.billNumber !== "—" ? `&invoice=${encodeURIComponent(row.billNumber)}` : ""
                            }`}
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
                          <ReceiptIcon size={12} />
                          <span>View Bill</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="admin-table-foot">
          <span>
            {filteredPayments.length} record{filteredPayments.length === 1 ? "" : "s"} shown
            {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
          </span>
          <div>
            <span>Page 1 of 1</span>
            <button type="button" aria-label="Previous page" disabled>
              ‹
            </button>
            <button type="button" aria-label="Next page" disabled>
              ›
            </button>
          </div>
        </div>
      </section>

      <div className="admin-footnote" style={{ marginTop: "12px" }}>
        StayEase Payment Settlement &amp; Billing Gateway · All timestamps in property local time (IST)
      </div>
    </div>
  );
}

