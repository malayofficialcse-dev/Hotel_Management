"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface, TextField } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";

const methods = [
  { title: "Credit / Debit card", icon: "credit-card" as const },
  { title: "UPI", icon: "phone" as const },
  { title: "Net Banking", icon: "wallet" as const },
  { title: "Wallet", icon: "wallet" as const },
];

export default function PaymentPage() {
  const { paymentMethod, setPaymentMethod } = useBooking();
  const router = useRouter();
  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/booking/confirmation");
  }

  return (
    <>
      <SiteHeader />
      <BookingStepper active={3} />
      <main className="mx-auto grid max-w-[1160px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-0">
        <div>
          <PageHeading title="Your getaway is almost booked." description="Choose a secure payment method to confirm your stay." />
          <div className="mt-5 rounded-[4px] bg-mint p-4 text-[10px]">
            <p className="flex items-center gap-2 font-semibold"><FigmaIcon name="lock" className="h-4 w-4" /> Safe, secure, and all yours.</p>
            <p className="mt-1 pl-6 text-muted">256-bit encrypted payments. Your card details are never stored.</p>
          </div>
          <form onSubmit={submitPayment}>
            <Surface className="mt-4 p-5">
              <h2 className="text-sm font-semibold">How would you like to pay?</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {methods.map((method) => {
                  const selected = method.title === paymentMethod;
                  return (
                    <button
                      type="button"
                      key={method.title}
                      onClick={() => setPaymentMethod(method.title)}
                      aria-pressed={selected}
                      className={`flex min-h-[58px] flex-col items-center justify-center gap-2 rounded-[4px] border text-[10px] ${
                        selected ? "border-forest bg-mint text-forest" : "border-line text-muted"
                      }`}
                    >
                      <FigmaIcon name={method.icon} className="h-4 w-4" />{method.title}
                    </button>
                  );
                })}
              </div>
              <div className="my-4 border-t border-line" />
              {paymentMethod === "Credit / Debit card" ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold">Credit / Debit card</h3>
                    <span className="flex gap-2 text-[9px] font-semibold"><span className="rounded-[4px] bg-sky px-2 py-1">VISA</span><span className="rounded-[4px] bg-butter px-2 py-1">Mastercard</span><span className="rounded-[4px] bg-mint px-2 py-1">RuPay</span></span>
                  </div>
                  <TextField label="Cardholder name *" defaultValue="Aarav Mehta" required />
                  <TextField label="Card number *" placeholder="••••  ••••  ••••  4242" required className="mt-3" inputMode="numeric" minLength={12} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <TextField label="Expiry date *" placeholder="MM / YY" required />
                    <TextField label="CVV *" type="password" placeholder="•••" required />
                  </div>
                </>
              ) : (
                <div className="rounded-[4px] bg-mist p-5 text-xs">
                  <h3 className="font-semibold">{paymentMethod}</h3>
                  <p className="mt-2 text-muted">
                    {paymentMethod === "UPI"
                      ? "Continue securely with your preferred UPI app."
                      : paymentMethod === "Net Banking"
                        ? "Choose your bank on the secure payment page."
                        : "Pay using a supported wallet on the secure payment page."}
                  </p>
                </div>
              )}
              <label className="mt-3 flex items-center gap-2 text-[10px] text-muted"><input type="checkbox" className="accent-[#486958]" /> Securely save this card for a faster checkout next time</label>
              <div className="mt-4 rounded-[4px] bg-mist p-3 text-[10px]"><FigmaIcon name="check" className="mr-2 h-3 w-3" /> Billing address is the same as my guest address</div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="text-[11px] text-muted">Amount payable</span>
                <strong className="text-lg">₹24,480</strong>
              </div>
              <Button type="submit" className="mt-4 w-full">Pay ₹24,480 &amp; confirm booking <FigmaIcon name="lock" className="h-4 w-4" /></Button>
              <p className="mt-3 text-[9px] text-muted">You may be redirected to your bank to complete verification. Please don’t close this page during payment.</p>
            </Surface>
          </form>
          <div className="mt-4 rounded-[4px] bg-sky p-4 text-[10px] text-muted">
            <FigmaIcon name="info" className="mr-2 h-3.5 w-3.5" /> Prefer another way? Pay with any UPI app, major Indian bank, or supported wallet using the options above.
          </div>
          <div className="mt-4 flex flex-wrap gap-5 text-[10px] text-muted">
            <span><FigmaIcon name="shield" className="mr-1 h-3 w-3" /> PCI DSS compliant</span>
            <span><FigmaIcon name="shield" className="mr-1 h-3 w-3" /> RBI-compliant payments</span>
            <span><FigmaIcon name="shield" className="mr-1 h-3 w-3" /> 24/7 booking support</span>
          </div>
          <Button href="/booking/review" variant="outline" className="mt-5">Back to review</Button>
        </div>
        <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
      </main>
      <SiteFooter />
    </>
  );
}
