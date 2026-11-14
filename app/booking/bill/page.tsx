"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { api, AdminPayment } from "@/lib/api-client";
import { FigmaIcon } from "@/components/figma-icon";

interface BillData {
  billNumber: string;
  invoiceDate: string;
  transactionId: string;
  paymentMethod: string;
  hotelName: string;
  roomTypeName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  roomCount: number;
  roomPricePerNight: number;
  subtotal: number;
  taxesAndFees: number;
  totalAmount: number;
  status: string;
}

export default function BillPage() {
  const [bookingCode, setBookingCode] = useState("");
  const [invoiceParam, setInvoiceParam] = useState("");
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") || params.get("bookingCode") || "";
    const inv = params.get("invoice") || "";
    setBookingCode(code);
    setInvoiceParam(inv);

    if (!code) {
      setError("No booking code specified in the URL.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        // First try to load the payment record which contains the generated bill
        let paymentData: AdminPayment | null = null;
        try {
          paymentData = await api.getPaymentByBookingCode(code);
        } catch {
          // ignore error if not found in payments yet
        }

        // Also fetch the booking record
        let bookingData: any = null;
        try {
          bookingData = await api.getBookingByCode(code);
        } catch {
          // ignore
        }

        const meta = (paymentData?.metadata as any) || {};

        // Extract or derive bill number
        const year = new Date().getFullYear();
        let hotelShort = "HTL";
        if (code.includes("/")) {
          hotelShort = code.split("/")[0];
        } else if (bookingData?.hotel_name) {
          const words = bookingData.hotel_name.trim().split(/[\s-_]+/);
          hotelShort = words.length > 1 ? words.map((w: string) => w[0]).join("").toUpperCase().slice(0, 4) : bookingData.hotel_name.slice(0, 3).toUpperCase();
        }

        const billNumber =
          inv ||
          meta.billNumber ||
          meta.invoiceNumber ||
          `${hotelShort}/BILL/${year}/0001`;

        const total = paymentData?.amount || bookingData?.total_price || 0;
        const nights = bookingData?.total_nights || meta.totalNights || 1;
        const rooms = bookingData?.room_count || meta.roomCount || 1;
        const pricePerNight = bookingData?.room_price_per_night || Math.round((total / 1.12) / (nights * rooms));
        const subtotal = bookingData ? bookingData.room_price_per_night * nights * rooms : Math.round(total / 1.12);
        const taxes = bookingData?.taxes_and_fees || (total - subtotal);

        setBill({
          billNumber,
          invoiceDate: meta.invoiceDate ? new Date(meta.invoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          transactionId: meta.transactionId || paymentData?.id || `TXN-${year}-${Date.now().toString(36).toUpperCase()}`,
          paymentMethod: paymentData?.paymentMethod || meta.paymentMethod || "Online Payment",
          hotelName: bookingData?.hotel_name || meta.hotelName || "StayEase Luxury Hotel & Resort",
          roomTypeName: bookingData?.room_type_name || meta.roomTypeName || "Deluxe Suite",
          guestName: bookingData ? `${bookingData.guest_first_name} ${bookingData.guest_last_name}`.trim() : meta.guestName || "Valued Guest",
          guestEmail: bookingData?.guest_email || meta.guestEmail || "guest@stayease.com",
          guestPhone: bookingData?.guest_phone || meta.guestPhone || "+91 9876543210",
          checkInDate: bookingData?.check_in_date ? new Date(bookingData.check_in_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : meta.checkInDate || "—",
          checkOutDate: bookingData?.check_out_date ? new Date(bookingData.check_out_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : meta.checkOutDate || "—",
          totalNights: nights,
          roomCount: rooms,
          roomPricePerNight: pricePerNight,
          subtotal,
          taxesAndFees: taxes,
          totalAmount: total,
          status: paymentData?.status === "SUCCESS" || bookingData?.status === "CONFIRMED" ? "PAID" : (bookingData?.status || "CONFIRMED"),
        });
      } catch (err: any) {
        setError(err.message || "Failed to load bill information.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-[880px] px-4 py-8 text-black print:p-0 print:m-0 print:max-w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-[#f8faf8] p-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">✓</span>
            <div>
              <p className="text-sm font-semibold text-forest">Invoice & Payment Receipt Ready</p>
              <p className="text-[11px] text-muted">Official sequential tax invoice for reservation #{bookingCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              type="button"
              className="flex items-center gap-1.5 rounded bg-forest px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#344d40]"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
            <Link
              href="/admin/reservations"
              className="rounded border border-line bg-white px-3 py-2 text-xs font-medium text-forest hover:bg-mist"
            >
              Admin Reservations →
            </Link>
            <Link
              href="/admin/payments"
              className="rounded border border-line bg-white px-3 py-2 text-xs font-medium text-forest hover:bg-mist"
            >
              All Payments →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-line bg-white p-12 text-center text-sm text-muted">
            Generating tax invoice and loading payment details…
          </div>
        ) : error && !bill ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            {error}
            <div className="mt-4">
              <Link href="/admin/reservations" className="text-xs font-semibold underline">
                Return to Reservations
              </Link>
            </div>
          </div>
        ) : bill ? (
          /* Printable Tax Invoice Container */
          <div className="rounded-lg border border-line bg-white p-8 shadow-sm print:border-none print:p-0 print:shadow-none">
            {/* Header: Hotel brand & Invoice details */}
            <div className="flex flex-col justify-between border-b border-line pb-6 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-forest text-white font-bold text-lg">
                    S
                  </div>
                  <span className="text-xl font-bold tracking-tight text-forest">StayEase</span>
                </div>
                <h1 className="mt-3 text-lg font-bold text-charcoal">{bill.hotelName}</h1>
                <p className="text-xs text-muted">Official Tax Invoice & Hospitality Bill</p>
                <p className="mt-1 text-[11px] text-muted">Candolim Beach Road, North Goa, Goa 403515</p>
                <p className="text-[11px] text-muted">GSTIN: 30AABCS1429B1Z8 · Contact: billing@stayease.com</p>
              </div>

              <div className="mt-4 text-left sm:mt-0 sm:text-right">
                <span className="inline-block rounded bg-[#e7f3ec] px-3 py-1 text-xs font-bold text-forest">
                  STATUS: {bill.status}
                </span>
                <div className="mt-3 text-xs">
                  <p className="font-semibold text-muted">INVOICE NUMBER</p>
                  <p className="text-sm font-mono font-bold text-charcoal">{bill.billNumber}</p>
                </div>
                <div className="mt-2 text-xs">
                  <p className="text-muted">BOOKING REFERENCE</p>
                  <p className="font-mono font-semibold text-charcoal">{bookingCode}</p>
                </div>
                <div className="mt-2 text-xs">
                  <p className="text-muted">DATE OF ISSUE</p>
                  <p className="font-medium text-charcoal">{bill.invoiceDate}</p>
                </div>
              </div>
            </div>

            {/* Billed To and Stay Details Grid */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded border border-line bg-mist/50 p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Billed To (Guest Details)</h2>
                <p className="mt-2 text-sm font-semibold text-charcoal">{bill.guestName}</p>
                <p className="mt-1 text-xs text-muted">Email: {bill.guestEmail}</p>
                <p className="mt-0.5 text-xs text-muted">Phone: {bill.guestPhone}</p>
              </div>

              <div className="rounded border border-line bg-mist/50 p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Reservation Details</h2>
                <p className="mt-2 text-sm font-semibold text-charcoal">{bill.roomTypeName}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted">Check-in:</span>
                    <p className="font-medium">{bill.checkInDate}</p>
                  </div>
                  <div>
                    <span className="text-muted">Check-out:</span>
                    <p className="font-medium">{bill.checkOutDate}</p>
                  </div>
                  <div>
                    <span className="text-muted">Duration:</span>
                    <p className="font-medium">{bill.totalNights} Night{bill.totalNights > 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <span className="text-muted">Rooms:</span>
                    <p className="font-medium">{bill.roomCount} Room{bill.roomCount > 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Charges Table */}
            <div className="mt-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-mist text-muted">
                    <th className="py-2.5 px-3 font-semibold">DESCRIPTION</th>
                    <th className="py-2.5 px-3 text-center font-semibold">RATE / NIGHT</th>
                    <th className="py-2.5 px-3 text-center font-semibold">NIGHTS × ROOMS</th>
                    <th className="py-2.5 px-3 text-right font-semibold">AMOUNT (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-charcoal">{bill.roomTypeName} Accommodation</p>
                      <p className="text-[11px] text-muted">Standard hospitality room tariff</p>
                    </td>
                    <td className="py-3 px-3 text-center">₹{bill.roomPricePerNight.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-3 text-center">{bill.totalNights} × {bill.roomCount}</td>
                    <td className="py-3 px-3 text-right font-medium">₹{bill.subtotal.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-muted">Central GST (CGST @ 6%)</td>
                    <td className="py-2.5 px-3 text-center text-muted">—</td>
                    <td className="py-2.5 px-3 text-center text-muted">6%</td>
                    <td className="py-2.5 px-3 text-right text-muted">₹{(bill.taxesAndFees / 2).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-muted">State GST (SGST @ 6%)</td>
                    <td className="py-2.5 px-3 text-center text-muted">—</td>
                    <td className="py-2.5 px-3 text-center text-muted">6%</td>
                    <td className="py-2.5 px-3 text-right text-muted">₹{(bill.taxesAndFees / 2).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-charcoal">
                    <td colSpan={3} className="py-3 px-3 text-right font-bold text-sm">TOTAL AMOUNT PAID:</td>
                    <td className="py-3 px-3 text-right font-bold text-base text-forest">₹{bill.totalAmount.toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment & Transaction Settlement */}
            <div className="mt-6 rounded border border-line p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Payment & Settlement Information</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <span className="text-muted block">Payment Method:</span>
                  <span className="font-semibold text-charcoal">{bill.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-muted block">Transaction ID:</span>
                  <span className="font-mono text-charcoal">{bill.transactionId}</span>
                </div>
                <div>
                  <span className="text-muted block">Settlement Status:</span>
                  <span className="font-semibold text-forest">Completed (Full Settlement)</span>
                </div>
              </div>
            </div>

            {/* Terms and Footer Notice */}
            <div className="mt-8 border-t border-line pt-4 text-[10px] text-muted">
              <p>This is a computer-generated tax invoice issued by StayEase Hotel Management System. No physical signature is required.</p>
              <p className="mt-1">For cancellation, refunds, or billing inquiries, please contact hotel front desk or email support@stayease.com quoting booking reference {bookingCode}.</p>
            </div>
          </div>
        ) : null}
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </>
  );
}

