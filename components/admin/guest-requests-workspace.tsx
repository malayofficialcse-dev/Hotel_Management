"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type GuestServiceRequest } from "@/lib/api-client";

const statuses = ["ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED", "DECLINED"];

function pretty(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stayDates(item: GuestServiceRequest) {
  if (!item.checkIn || !item.checkOut) return "Stay dates unavailable";
  return `${new Date(item.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(item.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function GuestRequestsWorkspace() {
  const [requests, setRequests] = useState<GuestServiceRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setRequests(await api.getAdminGuestServiceRequests()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load guest requests."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(item: GuestServiceRequest, status: string) {
    setUpdatingId(item.id);
    setError("");
    setNotice("");
    try {
      const updated = await api.updateGuestServiceRequestStatus(item.id, status);
      setRequests((current) => current.map((row) => row.id === updated.id ? { ...row, ...updated } : row));
      setNotice(`Request ${item.bookingCode || ""} marked ${pretty(status)}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update request status."); }
    finally { setUpdatingId(""); }
  }

  const visible = requests.filter((item) => statusFilter === "ALL" || item.status === statusFilter);

  return (
    <>
      <header className="admin-page-heading">
        <div><p className="admin-eyebrow">GUEST EXPERIENCE</p><h1>Guest service requests</h1><p>Review and update requests for your assigned property.</p></div>
        <button type="button" className="admin-secondary-button" onClick={() => void load()} disabled={loading}>Refresh</button>
      </header>
      <section className="admin-panel admin-table-panel">
        <div className="admin-table-tools">
          <div><strong>{visible.length}</strong> request{visible.length === 1 ? "" : "s"}</div>
          <label className="flex items-center text-[10px] font-medium text-muted">Status
            <select className="admin-select-button ml-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="OPEN">Open</option><option value="ACKNOWLEDGED">Acknowledged</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="DECLINED">Declined</option><option value="ALL">All requests</option>
            </select>
          </label>
        </div>
        {error && <p className="px-4 py-2 text-xs text-red-700" role="alert">{error}</p>}
        {notice && <p className="px-4 py-2 text-xs text-forest" role="status">{notice}</p>}
        {loading ? <div className="admin-empty">Loading guest requests…</div> : visible.length ? (
          <div className="divide-y divide-line">
            {visible.map((item) => <article key={item.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-charcoal">{pretty(item.requestType)}</h2><span className="rounded bg-mint px-2 py-1 text-[10px] font-semibold text-forest">{pretty(item.status)}</span></div>
                <p className="mt-1 text-xs text-muted">{item.guestName || "Guest"} · {item.bookingCode || "Booking"} · {item.hotelName || item.hotelId}</p>
                <p className="mt-1 text-[11px] text-muted">{item.guestEmail || ""}{item.guestEmail ? " · " : ""}{stayDates(item)}</p>
                {item.details && <p className="mt-3 rounded bg-[#f8faf8] p-3 text-xs text-charcoal">{item.details}</p>}
                <p className="mt-2 text-[10px] text-muted">Received {new Date(item.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <label className="text-[10px] font-semibold text-charcoal">Update status
                <select disabled={updatingId === item.id} value={item.status} onChange={(event) => void changeStatus(item, event.target.value)} className="mt-1 block min-w-40 rounded border border-line bg-white px-2 py-2 text-xs">
                  <option value="OPEN">Open</option>{statuses.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                </select>
              </label>
            </article>)}
          </div>
        ) : <div className="admin-empty">{statusFilter === "OPEN" ? "No open guest requests." : "No requests match this status."}</div>}
      </section>
    </>
  );
}
